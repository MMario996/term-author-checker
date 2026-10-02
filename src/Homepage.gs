// ============================================================================
// WORKSPACE ADD-ON HOMEPAGE (Default entry point)
// ============================================================================
function onHomepage(e) {
  var card = CardService.newCardBuilder();

  card.setHeader(CardService.newCardHeader()
    .setTitle('Kärcher TermCheck')
    .setSubtitle(_ct_('home.subtitle')));

  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText(_ct_('home.intro')));

  section.addWidget(_cardButton_(true)
    .setText('🔍 ' + _ct_('home.openTs'))
    .setOnClickAction(CardService.newAction().setFunctionName('showSidebar')));

  section.addWidget(_cardButton_(true)
    .setText('✍️ ' + _ct_('home.openAc'))
    .setOnClickAction(CardService.newAction().setFunctionName('showAuthorCheckSidebar')));

  card.addSection(section);
  return card.build();
}
// hostApp: von der Seitenleiste mitgeschickt (siehe _resolveHost_).
function apiShowHomeChooser(hostApp) {
  var host = _resolveHost_(hostApp);
  var ui = renderWithI18n_('HomeChooser', host.app)
    .setTitle('Kärcher TermCheck')
    .setWidth(300);
  host.ui.showSidebar(ui);
}