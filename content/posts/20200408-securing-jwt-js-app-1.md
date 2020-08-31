---
title: "Securing your jwt in a js app (video tutorial - part 1)"
description: How to secure your jwt in a js app to prevent XSS attacks using .net core as a backend
date: 2020-04-08T09:20:00
draft: true
tags: ["csharp","dotnetcore"]
summary: Where should you store a json web token in a single page application ? Local storage ? a Cookie ?
---

Are you wondering where to store a jwt token in your js app ? In this video tutorial I explain where and how to store a jwt token in order to avoid XSS attacks. 

{{< youtube QJ761kr0GZU >}}
Download source code https://github.com/wleme/JwtInJsApps
### Code Snippet 
{{< highlight cs "linenos=table,hl_lines=1 13-23 38-46" >}}
	//file: startup.cs
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
		//Setup your asp.net core application to use token authentication
            services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters()
        {
            ValidIssuer = Configuration["Auth:Issuer"],
            ValidAudience = Configuration["Auth:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["Auth:Key"]))
        };
    });
            
            services.AddControllers();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCookiePolicy();
			//Create custom middleware that retrieves the jwt token from the cookie. 
			//It has to come before UseAuthentication and UseAuthorization.
            app.Use(async (context, next) =>
            {
                var jwt = context.Request.Cookies[Support.Constants.Auth.JwtCookieName];
                if (jwt != null)
                    context.Request.Headers.Add("Authorization", "Bearer " + jwt);
                await next();
            });

            app.UseAuthentication();
            app.UseRouting();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
{{< / highlight>}}

{{< highlight cs "linenos=table,hl_lines=1 43-55" >}}
//file AuthController.cs
	[ApiController]
    [Route("[CONTROLLER]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration config;

        public AuthController(IConfiguration config)
        {
            this.config = config;
        }


        [HttpPost]
        [Route("login")]
        public IActionResult Login(AuthLoginDto dto)
        {
            if (dto.UserName == "username" && dto.Password == "password")
            {
                var claims = new List<Claim>()
                {
                    new Claim(JwtRegisteredClaimNames.Jti,Guid.NewGuid().ToString()),
                    new Claim(JwtRegisteredClaimNames.UniqueName,dto.UserName),
                };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Auth:Key"]));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token= new JwtSecurityToken(
                    config["Auth:Issuer"],
                    config["Auth:Audience"],
                    claims,
                    expires: DateTime.UtcNow.AddHours(1),
                    signingCredentials: creds
                    );


                var results = new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    expirationUtc = token.ValidTo
                };
				//Create a cookie based on a custom request header sent by the client
                if (Request.Headers.TryGetValue("X-Return-Cookie", out var returnCookie))
                {
                    if (returnCookie.ToString().ToUpper() == true.ToString().ToUpper())
                    {
                        Response.Cookies.Append(Support.Constants.Auth.JwtCookieName, results.token, new Microsoft.AspNetCore.Http.CookieOptions()
                        {
                            HttpOnly = true,
                            Expires = dto.RememberMe ? results.expirationUtc : (DateTime?)null,
                            Secure = true
                        });
                    }
                }

                return Created("", results);
            }

            return BadRequest("Cannot login");
        }
    }
{{< / highlight>}}