// Test locale file, copied from mozilla/commonplace's test cases.
(function() {
if (!navigator.l10n) {navigator.l10n = {};}
navigator.l10n.language = "es";
navigator.l10n.strings = {"My String":"El String","Result":["Resulto","N Resultos"],"Triple Result":["Un Resulto","Dos Resultos","Resultos"],"Partially Localized Plural String":["PLPS","","PLPSes"],"No Plural Form String":"NPFS"};
navigator.l10n.pluralize = function(n) {
  return (n != 1);
};
})();
