---
title: "Enumerators in your Api - How to handle enums in your .Net Core Api"
description: "How to handle enums in your .Net Core Api"
#images: ["a.aa.jpg"]
date: 2018-12-06T16:48:04-05:00
draft: false
categories: [.Net]
seq: 0001
cover: /imgs/0001 - Enums And Api.png#center
---
You should never make your api consumers understand your enums. They should never send or receive numbers (10, 20, ...) for things like AddressType, 
Gender, Day of the week and so forth. What does number 10 mean anyway ? You don't even know yourself! This project shows how we can deal with a string coming in, convert it to an enumerator and respond to the caller by sending a string again.

Our api receives a new address and adds it to the database (there's no database though). An address can be 'Home' or 'Office'
and they are represented by the following:

{{< highlight cs>}}
    public class Address
    {
        public int Id { get; set; }
        public string StreetName { get; set; }
        public AddressType AddressType { get; set; }
    }
{{</highlight>}}
{{< highlight cs >}}
    public enum AddressType: int
    {
        Home = 10,
        Office =20
    }
{{</highlight>}}
Again, you don't want to make your api consumers understand your enums. They should send and receive Home or Office instead of 10 or 20.

#### Create a new dto with a custom validator

Create a new dto that will receive the data in your post method and add a custom validator that will make sure the string supplied is valid. The custom validator tries to convert the string supplied to a valid AddressType enum. It also re-sets the string to the string representation of the enum. Ie. If you send up "hOme", the string will be converted back to "Home".

{{< highlight cs >}}
    public class AddressDto : IValidatableObject
    {
        [Required]
        public string StreetName { get; set; }
        public string AddressType { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (!Enum.TryParse(Type,true,out AddressType result))
            {
                yield return new ValidationResult("Invalid address type", new[] { nameof(AddressType) });
            }

            Type = result.ToString(); //normalize Type
        }
    }
{{</highlight>}}

#### Receive the dto in your api method

The controller needs to validate the model which, according to our custom validator above, will not be valid if they send up something different than home or office. It also converts the dto to the model using automapper, adds the model and converts the model to a response dto.

{{< highlight cs >}}
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddressDto addressDto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var model = _mapper.Map<AddressDto, Address>(addressDto);
                await _addressRepo.AddAsync(model);
                await _addressRepo.SaveAllAsync();
                var output = _mapper.Map<Address, AddressResponseDto>(model);
                return Created($"/api/addresses/{model.Id}", output);

            }
            catch (Exception e)
            {
                _log.LogError($"error adding address {e}");
            }

            return BadRequest();
        }
{{</highlight>}}

#### Converting dto to Model

We use automapper to convert objects from/to different types. When we convert from AddressDto to Address we need to tell automapper that the string of AddressDto.AddressType needs to be set to a enum in the Address.AddressType and we do that by creating the following profile:
{{< highlight cs >}}
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<AddressDto, Address>()
                .ForMember(o => o.AddressType, ex => ex.MapFrom(o => Enum.Parse(typeof(AddressType), o.AddressType))); //maps from string to enum

            CreateMap<Address, AddressResponseDto>();
        }
    }
{{</highlight>}}
The profile above also creates a map between Address and AddressResponseDto.

#### ResponseDto

The difference between the request dto and the response dto is the response has an Id field and the AddressType is the enum itself and no longer a string. The idea here is you always deal with an enumerator within your application and only have the string representation if you are receiving/sending data from/to your api consumer.
{{< highlight cs >}}
    public class AddressResponseDto
    {
        public int Id { get; set; }
        public string StreetName { get; set; }
        public AddressType AddressType{ get; set; }
    }
{{</highlight>}}

**But we are sending back to the consumer the AddressResponseDto which uses an enumerator. How do we convert it to string?**

We could convert manually on every method that deals with the same dto but that would mean duplication all over. What we do instead is we set a default JSON serializer which converts ALL enums to a string in **_startup.cs_**:

{{< highlight cs >}}
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddAutoMapper();
            services.AddSingleton<IAddressRepo, AddressRepoInMemory>();
            services.AddMvc()
              .AddJsonOptions(opt => {
                  opt.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter()); //serialize all enums
              });
        }
{{</highlight>}}


[Source Code](https://github.com/wleme/HandlingEnumsInApi)
