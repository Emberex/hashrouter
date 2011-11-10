

<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <title>HashRouter - hr - jQuery Plugin</title>
    <script src="js/jquery-1.6.4.min.js" type="text/javascript"></script>
    <script src="js/jquery.history.js" type="text/javascript"></script>
    <script src="js/jquery.hashrouter-1.0.js" type="text/javascript"></script>
    <script src="js/jquery-ui-1.8.16.custom.min.js" type="text/javascript"></script>
    <script type="text/javascript" src="js/jquery.scrollTo-1.4.2.js"></script>
    <link href="css/style.css" rel="stylesheet"/>
  </head>
  <body>
  <script type="text/javascript">
    $(function() {
      var routes = { page : {
        optionalRoutes : {
            leftCircle : {
              _ : {
                centerCircle : { _ : {} }
              }
            }
          },
        documentation : {
          scrollTo : {}
        },
        _ : {}
        }
      };

      $.hr.init({routes:routes});
      $.hr.setDefault('page','default');
      $('#mainContent').hr('page', function(value){
        if(value){
          $(this).html(''); //empty it right away so other things on the page we are leaving don't trigger.
          $(this).load(value + ".html?" + Math.random(), function(){
            $.hr.parseElement(this);
            var source = $('#viewSourceBox').clone().show();
            var addr = location.href.substring(0, location.href.indexOf('#')) + value + '.html';
            $('a', source).attr('href', 'view-source:' + addr);
            $(this).append(source);

          });
        }
      });

      $.hr.bind('scrollTo',function(value){
        if(value && $('#' + value).length) {
          $.scrollTo('#' + value);
        }
      });

      $.hr.triggerAll();
    });

    pageScripts = {
        randomColor : function(variable, otherVariables){
          return Math.floor(Math.random()*16777215).toString(16);
        }
    };
  </script>
  <div class="footerPlacementWrapper">
  <div class="header">
    <div class="centering">
    <div class="slug">easy url routing<br/> for ajax applications</div>
    <div class="title">
      <div class="hash"><a href="##">Hash</a></div>
      <div class="route"><a href="##">Router</a></div>
    </div>

      <ul class="navigation">
        <li><a href="##">Features</a></li><li><a href="##page:documentation">Documentation</a></li><li><a href="##page:download">Download</a></li><li><a href="##page:roadmap">Roadmap</a></li><li><a href="##page:about">About</a></li>
      </ul>
    </div>
  </div>

  <div class="content" id="mainContent">
<?php
  //this code is for google indexing, see here:
  //http://code.google.com/web/ajaxcrawling/docs/specification.html
    if(isset($_REQUEST["_escaped_fragment_"])){
        $fragment = $_REQUEST["_escaped_fragment_"];

        $fragments = explode("/", $fragment);
        foreach($fragments as $f){
          if(strlen($f) > 1){
            if(file_exists($f)){
              include($f);
            }
            if(file_exists($f . ".html")){
              include($f . ".html");
            }

          }
        }
    }
?></div>


  <div class="whitebox" style="display:none" id="viewSourceBox">
    <p>This site is built with the HashRouter toolkit, please use it as a reference.</p>
    <p><a href="">View Source</a> (Chrome/Firefox)</p>
  </div>


  <div class="push"></div>
  </div>
  <div class="footer">
    <div class="centering">
        <a href="http://emberex.com/"><img src="img/emberex.png"></a>
        <div class="copyright">
        &copy; 2011 Emberex Inc<br/>
        HashRouter source licenced under MIT Licence.
        </div>
    </div>
  </div>
  </body>
</html>