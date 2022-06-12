//active menu highligh

$(document).load(function () {
  if ($("li#navbarDropdown1")) {
    $("li.nav-item.dropdown.myCategories").attr("style", "background-color:orange;");
    $("span.nav-link.dropdown-toggle.myCategories").attr("style", "color:#fff;");
  }

  if ($("div#_guidelines")) {
    $("li.nav-item.dropdown.guidelines").attr("style", "background-color:orange;");
    $("span.nav-link.dropdown-toggle.guidelines").attr("style", "color:#fff;");
  }

  if ($('a[href="/awardWinners"]')) {
    $("li.nav-item.nav-border.judgingGroups").attr("style", "background-color:orange; color:#fff;");
    $("li.nav-item.nav-border.judgingGroups").attr("style", "color:#fff;");
  }

  if ($('a[href="/judgingGroups"]')) {
    $("li.nav-item.nav-border.judgingGroups").attr("style", "background-color:orange; color:#fff;");
    $("li.nav-item.nav-border.judgingGroups").attr("style", "color:#fff;");
  }

  if ($("li#navbarDropdown5")) {
    $("li.nav-item.dropdown.appendix").attr("style", "background-color:orange;");
    $("span.nav-link.dropdown-toggle.appendix").attr("style", "color:#fff;");
  }
});
