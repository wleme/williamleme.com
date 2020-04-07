---
title: "Securing your jwt in a js app"
description: How to secure your jwt in a js app to prevent XSS attacks
date: 2020-05-07T08:20:00
draft: true
tags: ["#csharp"]
---

After almost 3 years of flawless service availaility my app service came to a halt with the following event entry

{{< highlight cs "linenos=table" >}}
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
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

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCookiePolicy();

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

No code changes and no service changes were made so the solution was to **restart the app service** :rage:
