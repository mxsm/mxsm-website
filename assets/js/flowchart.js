{{ with .Site.Params.flowchart }}
{{ if .enable }}
(function($) {
  $('.language-flow').each(function(index) {
    $(this).hide();
    var id = "language-flow-"+index;
    $(this).after('<div id="'+id+'"></div>');
    var diagram = flowchart.parse($(this).text());
    diagram.drawSVG(id);
  });

})(jQuery);
{{ end }}
{{ end }}
