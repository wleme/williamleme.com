document.addEventListener("DOMContentLoaded",() => {
    const socialIcons = document.querySelectorAll('nav.social a');
    socialIcons.forEach((elem) => {
        elem.setAttribute('target','_blank');
    })
    
})
