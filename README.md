
upgrade:

change layout\index.html and include


    <div style="display: flex;
    width: 100%;
    margin-top: 1em;font-weight: 600;">
      >> <a href="/posts">See all</a>


      or 

      {{ $paginator := .Paginate ( where .Site.RegularPages "Type" "ne" "page") }}

{{- $homepageWidgets := .Site.Params.widgets.homepage -}}
{{- if $homepageWidgets -}}
<!-- (where .Pages "Type" "posts")  -->
<div class='container list-container'>
  <ul class='list'>
    <!-- { range .Paginator.Pages } -->
     {{ range $paginator.Pages }}
      {{ .Render "li" }}
    {{ end }}
  </ul>

  {{ partial "nav/pagination" . }}
</div>