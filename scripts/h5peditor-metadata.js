/*global H5P*/
var H5PEditor = H5PEditor || {};
var H5PIntegration = H5PIntegration || false;
var ns = H5PEditor;

/**
 * Creates a metadata form
 *
 * @param {object} field
 * @param {object} metadata params for the metadata fields
 * @param {jQuery} $container
 * @param {mixed} parent used in processSemanticsChunk()
 * @param {string} [formType] Form type main|sub|...
 * @returns {ns.Coordinates}
 */
H5PEditor.metadataForm = function (field, metadata, $container, parent, formType) {
  /*
   * TODO: Is there a decent way to make this a "real class" that can be used?
   *       Changing all the fields by using a DOM selector in other files feels very wrong.
   */
  var self = this;
  self.field = field;
  self.metadata = metadata;
  self.parent = parent;

  // Set default title, but not for main content
  if (formType !== 'main' && (!self.metadata.title || self.metadata.title === '')) {
    self.metadata.title = H5PEditor.t('core', 'untitled') + ' ' + H5PEditor.parent.currentLibrary.split(' ')[0].split('.')[1];
  }

  self.metadataSemantics = Object.keys(H5PEditor.metadataSemantics).map(function (item) {
    return H5PEditor.metadataSemantics[item];
  });

  var $wrapper = H5PEditor.$('' +
  '<div class="h5p-editor-dialog h5p-dialog-wide h5p-metadata-wrapper">' +
    '<div class="h5p-metadata-header">' +
      '<div class="h5p-title-container">' +
        '<h2>' + H5PEditor.t('core', 'metadataSharingAndLicensingInfo') + '</h2>' +
        '<p>' + H5PEditor.t('core', 'fillInTheFieldsBelow') + '</p>' +
      '</div>' +
      '<div class="metadata-button-wrapper">' +
        '<a href="#" class="h5p-metadata-button h5p-save">' + H5PEditor.t('core', 'saveMetadata') + '</a>' +
      '</div>' +
    '</div>' +
  '</div>');

  // Create a group to handle the copyright data
  function setCopyright(field, value) {
    self.metadata = value;
  }
  var group = new H5PEditor.widgets.group(field, getPartialSemantics('copyright'), self.metadata, setCopyright);
  group.appendTo($wrapper);
  group.expand();

  group.$group.find('.title').remove();
  group.$group.find('.content').addClass('copyright-form');
  field.children = [group];

  // Locate license and version selectors
  var licenseField = find(group.children, 'field.name', 'license');
  var versionField = find(group.children, 'field.name', 'licenseVersion');
  versionField.field.optional = true; // Avoid any error messages

  // Listen for changes to license
  licenseField.changes.push(function (value) {
    // Find versions for selected value
    var option = find(licenseField.field.options, 'value', value);
    var versions = (option) ? option.versions : undefined;

    versionField.$select.prop('disabled', versions === undefined);
    if (versions === undefined) {
      // If no versions add default
      versions = [{
        value: '-',
        label: '-'
      }];
    }

    // Find default selected version
    var selected = (self.metadata.license === value &&
                    self.metadata ? self.metadata.licenseVersion : versions[0].value);

    // Update versions selector
    versionField.$select.html(H5PEditor.Select.createOptionsHtml(versions, selected)).change();
  });

  // Trigger update straight away
  licenseField.changes[licenseField.changes.length - 1](self.metadata.license);

  // Create and append the rest of the widgets and fields
  // Append the metadata author list widget
  H5PEditor.metadataAuthorWidget(getPartialSemantics('authorWidget').fields, self.metadata, group, this.parent);

  // Append the additional license field
  var widget = H5PEditor.$('<div class="h5p-metadata-license-extras"></div>');
  ns.processSemanticsChunk([getPartialSemantics('licenseExtras')], self.metadata, widget, this.parent);
  widget.appendTo(group.$group.find('.content.copyright-form'));

  // Append the metadata changelog widget
  H5PEditor.metadataChangelogWidget([getPartialSemantics('changeLog')], self.metadata, group, this.parent);

  // Append the additional information field
  var $widget = H5PEditor.$('<div class="h5p-metadata-additional-information"></div>');
  ns.processSemanticsChunk([getPartialSemantics('authorComments')], self.metadata, $widget, this.parent);
  $widget.appendTo(group.$group.find('.content.copyright-form'));

  $wrapper.find('.h5p-save').click(function () {

    $wrapper.toggleClass('h5p-open');
    $container.closest('.tree').find('.overlay').toggle();
  });

  // Sync with main title form
  if (formType === 'main') {
    const $titleFieldMeta = group.$group.find('.field.field-name-title.text').find('input.h5peditor-text');
    const $titleFieldMain = parent.syncTitle($titleFieldMeta);

    $titleFieldMain.on('input.titleFieldMeta', function() {
      $titleFieldMeta.val($titleFieldMain.val());
    });
  }

  // Set author of main content. TODO: Add realName to H5PIntegration
  if (formType === 'main' && H5PIntegration && H5PIntegration.user && H5PIntegration.user.name) {
    $wrapper.find('.h5p-author-data').find('.field-name-name').find('input.h5peditor-text').val(H5PIntegration.user.name);
  }

  $wrapper.appendTo($container);

  function getPartialSemantics(selector) {
    return find(self.metadataSemantics, 'name', selector);
  }
};

/**
 * Help find object in list with the given property value.
 *
 * @param {Object[]} list of objects to search through
 * @param {string} property to look for
 * @param {string} value to match property value against
 */
function find (list, property, value) {
  var properties = property.split('.');

  for (var i = 0; i < list.length; i++) {
    var objProp = list[i];

    for (var j = 0; j < properties.length; j++) {
      objProp = objProp[properties[j]];
    }

    if (objProp === value) {
      return list[i];
    }
  }
}
