var SHARE_TITLE = 'Share';
var isActionPopOpen = 0;
var isFolderManagePopOpen = 0;
var isSearchTabPopupOpen = 0;
var isUpgradeItemPopupOpen = 0;
var MSG_PURCHASE_ITEM = 'Purchase: %item';
var MSG_EMAIL_VALIDATION = 'Your Email was Validated!';
var MENU_HIGHLIGHTS = 'highlights';
var ACTION_POPUP_TOP = 115;

function hidePopup() {
	if ($('#topView .topSearch').is(':visible') == false) {
		$('#mask').fadeOut(150);
	}

	$('#modalPopupContainer').fadeOut(150, function() {
		$('#modalPopupContainer').css('position', 'fixed');
		$('#modalPopupContainer').empty();
	});

	isActionPopOpen = 0;
	isFolderManagePopOpen = 0;
	isSearchTabPopupOpen = 0;
	isUpgradeItemPopupOpen = 0;
}

// action popup
function showActionPopup(obj, item, folderId, fromFolder) {
	if (isActionPopOpen == 1) {
		return;
	}
	isActionPopOpen = 1;
	var html = 	'<div class="actionPopup">' +
					'<div class="popupBlock"></div>' +
				'</div>';
	$('#modalPopupContainer').empty();
	$('#modalPopupContainer').append(html);
	var w = parseInt($(obj).css('width'));
	var h = parseInt($(obj).css('height'));
	var top = ACTION_POPUP_TOP;
	var left = $(obj).offset().left;
	$('#modalPopupContainer').css('top', top + 'px');
	$('#modalPopupContainer').css('left', left + 'px');
	if (fromFolder == 1) {
		var piHtml = '<div class="0-folder popupItem">My Highlights</div>';
		$('.actionPopup .popupBlock').append(piHtml);
		clickPopupItem('0-folder', $('.item.selected'));
	}

	if (fromFolder == 0 && gFolders.length == 0) {
		var html = '<div class="popupItem small nohover">' + gLanguageObj.NO_FOLDER_YET[gLanguage] + '</div>';
		$('.actionPopup .popupBlock').append(html);
	} else {
		for (var i=0;i<gFolders.length;i++) {
			if (gFolders[i].folderId == folderId) {
				continue;
			}
			var name = gFolders[i].folderId + '-folder';
			var html =
				'<div class="' + name + ' popupItem">' +
					gFolders[i].folderName +
				'</div>';
			$('.actionPopup .popupBlock').append(html);
			clickPopupItem(name, $('.item.selected'));
		}
	}
	$('#modalPopupContainer').hide();
	$('#modalPopupContainer').fadeIn(150);

	function clickPopupItem(name, items) {
		$('.' + name + '.popupItem').click(function(e) {
			var items = $('.item.selected');
			var fId = -1;
			try {
				fId = $(e.target).attr('class').split('-')[0];
			} catch (e) {}
			if (fId == -1 || items.length == 0) {
				alert(gLanguageObj.NO_ITEMS_SELECTED[gLanguage]);
				hidePopup();
			} else {
				addPagesToFolder(fId);
			}
		});
	}
}

// folder manage popup
function showFolderManagePopup(obj, folderId, folderName) {
	if (isFolderManagePopOpen == 1) {
		return;
	}

	isFolderManagePopOpen = 1;
	var html = 	'<div class="folderManagePopup">' +
					'<div class="popupBlock">' +
						'<div class="topPart">' +
							'<div class="title">' + gLanguageObj.FOLDER_SETTING[gLanguage] + '</div>' +
							'<div class="closeBtn"></div>' +
						'</div>' +

						'<div class="namePart">' +
							'<div class="name">' + gLanguageObj.PLACEHOLDER_NAME[gLanguage] + '</div>' +
							'<div class="nameSubPart">' +
								'<input type="text" name="folderNameInput" class="folderNameInput">' +
							'</div>' +
						'</div>' +
						'<div class="line"></div>' +
						'<div class="donePart">' +
							'<div class="deletePart">' +
								'<div class="deleteBtn"></div>' +
							'</div>' +
							'<div class="cancelBtn">' + gLanguageObj.CANCEL[gLanguage] + '</div>' +
							'<div class="doneBtn">' + gLanguageObj.DONE[gLanguage] + '</div>' +
						'</div>' +
					'</div>' +
				'</div>';
	$('#modalPopupContainer').empty();
	$('#modalPopupContainer').append(html);
	var w = parseInt($(obj).css('width'));
	var h = parseInt($(obj).css('height'));
	$('#modalPopupContainer').css('top', $(window).height()/2 - $('#modalPopupContainer').height()/2)
	$('#modalPopupContainer').css('left', $(window).width()/2 - $('#modalPopupContainer').width()/2);
	// var top = $(obj).offset().top + h + 6;
	// var left = $(obj).offset().left;
	// $('#modalPopupContainer').css('top', top + 'px');
	// $('#modalPopupContainer').css('left', left + 'px');
	$('.namePart .nameSubPart .folderNameInput').val(folderName);
	$('.folderManagePopup .closeBtn').click(function(e) {
		hidePopup();
	});
	$('.folderManagePopup .deletePart .deleteBtn').click(function(e) {
		if (confirm(gLanguageObj.DELETE_FOLDER[gLanguage]) == true) {
			clickFolderDeleteButton(folderId, folderName);
		}
	});
	$('.folderManagePopup .donePart .cancelBtn').click(function(e) {
		hidePopup();
	});
	$('.folderManagePopup .donePart .doneBtn').click(function(e) {
		var newName = $('.namePart .nameSubPart .folderNameInput').val();
		if (newName != folderName) {
			clickFolderDoneButton(folderId, newName);
		} else {
			hidePopup();
		}
	});
	$('#mask').fadeIn(150);
	$('#modalPopupContainer').hide();
	$('#modalPopupContainer').fadeIn(150);
}

function showSearchTabPopup(e) {
	isSearchTabPopupOpen = 1;
	var html = 	'<div class="searchTabPopup">' +
					'<div class="popupBlock">' +
						'<div class="collection popupItem">Collection</div>' +
						'<div class="discovery popupItem">Discover</div>' +
					'</div>' +
				'</div>';
	$('#modalPopupContainer').empty();
	$('#modalPopupContainer').append(html);
	var w = parseInt($('.searchTabContainer').css('width'));
	var h = parseInt($('.searchTabContainer').css('height'));
	var top = $('.searchTabContainer').offset().top + h + 6;
	var left = $('.searchTabContainer').offset().left;
	$('#modalPopupContainer').css('top', top + 'px');
	$('#modalPopupContainer').css('left', left + 'px');
	$('.searchTabPopup').css('display', 'inline-block');
	$('.searchTabPopup').css('position', 'relative');
	$('.searchTabPopup').css('width', '116px');
	$('.searchTabPopup').css('height', '102px');
	$('.searchTabPopup').css('box-shadow', '0 2px 4px 1px rgba(0, 0, 0, 0.1)');
	$('.searchTabPopup').css('border-radius', '5px');
	$('.searchTabPopup').css('border', 'solid 1px #f1f3f3');
	$('.searchTabPopup').css('background-color', '#ffffff');
	$('.searchTabPopup .popupBlock').css('display', 'inline-block');
	$('.searchTabPopup .popupBlock').css('width', '100%');
	$('.searchTabPopup .popupBlock').css('height', '100%');
	$('.searchTabPopup .popupBlock').css('padding-bottom', '24px');
	$('.searchTabPopup .popupBlock .popupItem').css('cursor', 'pointer');
	$('.searchTabPopup .popupBlock .popupItem').css('display', 'inline-block');
	$('.searchTabPopup .popupBlock .popupItem').css('width', '116px');
	$('.searchTabPopup .popupBlock .popupItem').css('height', '17px');
	$('.searchTabPopup .popupBlock .popupItem').css('padding-top', '22px');
	$('.searchTabPopup .popupBlock .popupItem').css('padding-left', '15px');
	$('.searchTabPopup .popupBlock .popupItem').css('padding-bottom', '1px');
	$('.searchTabPopup .popupBlock .popupItem').css('font-family', 'Lato').css('font-weight', '400');
	$('.searchTabPopup .popupBlock .popupItem').css('font-size', '14px');
	$('.searchTabPopup .popupBlock .popupItem').css('color', '#747575');
	$('.searchTabPopup .popupBlock .popupItem').css('overflow', 'hidden');
	$('.searchTabPopup .popupBlock .popupItem').css('text-overflow', 'ellipsis');
	$('.searchTabPopup .popupBlock .collection').hover(function() {
    	$(this).css('color', '#46cabb');
    }, function() {
    	$(this).css('color', '#747575');
	});
	$('.searchTabPopup .popupBlock .discovery').hover(function() {
    	$(this).css('color', '#46cabb');
    }, function() {
    	$(this).css('color', '#747575');
	});
	$('.collection.popupItem').click(function(e) {
		$('#topView .searchTabContainer .target').text('Collection');
		hidePopup();
		window.location.href = PATH_HOST + PATH_COLLECTION + '/' + MENU_HIGHLIGHTS + PARAM_SEARCH;
	});
	$('.discovery.popupItem').click(function(e) {
		$('#topView .searchTabContainer .target').text('Discover');
		hidePopup();
		window.location.href = PATH_HOST + PATH_DISCOVERY + PARAM_SEARCH;
	});
	$('#modalPopupContainer').hide();
	$('#modalPopupContainer').fadeIn(150);
}

// chrome extension download popup
function showDownloadPopup(obj) {
	if ($('.downloadPopup').length > 0) {
		return;
	}

	var browser = '';
	var downloadUrl = '';
	if (navigator.userAgent.indexOf('Chrome') != -1) {
		browser = 'Chrome';
		downloadUrl = 'https://chrome.google.com/webstore/detail/web-and-pdf-highlighter-f/bmhcbmnbenmcecpmpepghooflbehcack';
	} else if (navigator.userAgent.indexOf('Firefox') != -1) {
		browser = 'Firefox';
		downloadUrl = 'https://addons.mozilla.org/en-US/firefox/addon/liner-web-pdf-highlighter/';
	} else if (navigator.userAgent.indexOf('Safari') != -1) {
		browser = 'Safari';
		downloadUrl = 'https://getliner.com/download/safari';
	} else {
		return;
	}

	if ($('.blurDownloadPopupContainer').length == 0) {
		var fakeFreedomModal =  '<div class="blurDownloadPopupContainer">' +
									'<div class="blur_bg"></div>' +
									'<div class="blurDownloadPopup">' +
										'<div class="closeBtn"></div>' +
										'<div class="topSection"></div>' +
										'<div class="bottomSection">' +
											'<div class="title">You Need to Download LINER First!</div>' +
											'<div class="desc">You need LINER for ' + browser + ' to start highlighting.</div>' +
											'<a class="downloadBtn" href="' + downloadUrl + '" target="_blank">' +
												'<img class="enhance_focus" src="/landing/image/at_field.gif">' +
												'<div class="name">DOWNLOAD NOW</div>' +
											'</a>' +
										'</div>' +
									 '</div>' +
								'</div>';

		$('body').append(fakeFreedomModal);
		$('.blurDownloadPopupContainer .blurDownloadPopup').css('top', $(window).height()/2 - $('.blurDownloadPopupContainer .blurDownloadPopup').height()/2);
		$('.blurDownloadPopupContainer').fadeIn(150);

		var isBlurDownloadPopupClosing = 0;
		$('.blurDownloadPopup .closeBtn').click(function(e) {
			if (isBlurDownloadPopupClosing == 1) {
				return;
			}

			isBlurDownloadPopupClosing = 1;
			$('.blurDownloadPopupContainer').fadeOut(150, function() {
				$('.blurDownloadPopupContainer').remove();
				isBlurDownloadPopupClosing = 0;
				setTimeout(function() { detectDownloadPopupClosed(); }, 1000)
			});
		});
	}

	var DOWNLOAD_POPUP_TOP = $('.listContainer').offset().top;
	if ($('#downloadPopupContainer').is(':visible')) {
		var w = parseInt($(obj).css('width'));
		var l = parseInt($(obj).css('left'));
		var top = DOWNLOAD_POPUP_TOP;
		var left = l + w + 15;
		$('#downloadPopupContainer').css('top', top + 'px');
		$('#downloadPopupContainer').css('left', left + 'px');
		return;
	}
	$('body').append('<div id="downloadPopupContainer"></div>');
	var html = 	'<div class="downloadPopup">' +
					'<div class="popupBlock">' +
						'<div class="title">LINER for ' + browser + '</div>' +
						'<div class="content">Start highlighting on desktop.<br>Then take over the world.</div>' +
						'<div class="downloadBtn">' +
							'<img class="enhance_focus" src="/landing/image/at_field.gif">' +
							'<div class="name">DOWNLOAD NOW</div>' +
						'</div>' +
					'</div>' +
				'</div>';
	$('#downloadPopupContainer').empty();
	$('#downloadPopupContainer').append(html);
	var w = parseInt($(obj).css('width'));
	var l = parseInt($(obj).css('left'));
	var top = DOWNLOAD_POPUP_TOP;
	var left = l + w + 15;
	$('#downloadPopupContainer').css('top', top + 'px');
	$('#downloadPopupContainer').css('left', left + 'px');
	$('.downloadPopup .downloadBtn').click(function(e) {
		window.open(downloadUrl, '_blank');
	});
	$(window).resize(function() {
		if ($('.downloadPopup').is(':visible')) {
			var w = parseInt($(obj).css('width'));
			var l = parseInt($(obj).css('left'));
			var top = DOWNLOAD_POPUP_TOP;
			var left = l + w + 15;
			$('#downloadPopupContainer').css('top', top + 'px');
			$('#downloadPopupContainer').css('left', left + 'px');
		}
	});
	$('#downloadPopupContainer').show();
}

// chrome extension download popup
function showIntegrationPopup(obj) {
	if ($('.integrationPopup').length > 0) {
		return;
	}

	var DOWNLOAD_POPUP_TOP = $('.listContainer').offset().top;
	if ($('#integrationPopupContainer').is(':visible')) {
		var w = parseInt($(obj).css('width'));
		var l = parseInt($(obj).css('left'));
		var top = DOWNLOAD_POPUP_TOP;
		var left = l + w + 15;
		$('#integrationPopupContainer').css('top', top + 'px');
		$('#integrationPopupContainer').css('left', left + 'px');
		return;
	}
	$('body').append('<div id="integrationPopupContainer"></div>');
	var html = 	'<div class="integrationPopup">' +
					'<div class="popupBlock">' +
						// '<div class="closeBtn"></div>' + // hj.lee: commented
						'<div class="title">' + gLanguageObj.INTEGRATION[gLanguage] + '</div>' +
						'<div class="content"></div>' +
						'<div class="connectBtn">' + gLanguageObj.CONNECT_NOW[gLanguage] + '</div>' +
					'</div>' +
				'</div>';
	$('#integrationPopupContainer').empty();
	$('#integrationPopupContainer').append(html);
	var w = parseInt($(obj).css('width'));
	var l = parseInt($(obj).css('left'));
	var top = DOWNLOAD_POPUP_TOP;
	if ($('.downloadPopup').length > 0) {
		top = DOWNLOAD_POPUP_TOP + parseInt($('.downloadPopup').css('width')) - 24;
	}
	var left = l + w + 15;
	$('#integrationPopupContainer').css('top', top + 'px');
	$('#integrationPopupContainer').css('left', left + 'px');
	$('.integrationPopup .closeBtn').click(function(e) {
		$('#integrationPopupContainer').hide();
		$('#integrationPopupContainer').remove();
	});
	$('.integrationPopup .connectBtn').click(function(e) {
		window.location.href = PATH_HOST + PATH_READING_LIST;
	});
	$(window).resize(function() {
		if ($('.integrationPopup').is(':visible')) {
			var w = parseInt($(obj).css('width'));
			var l = parseInt($(obj).css('left'));
			if ($('.downloadPopup').length > 0) {
				top = DOWNLOAD_POPUP_TOP + parseInt($('.downloadPopup').css('width')) - 24;
			}
			var left = l + w + 15;
			$('#integrationPopupContainer').css('top', top + 'px');
			$('#integrationPopupContainer').css('left', left + 'px');
		}
	});
	$('#integrationPopupContainer').show();
}

$('#mask').click(function(e) {
	if (isUpgradeItemPopupOpen == 1) {
		$('.linerUpgradeFrame').fadeOut(150, function() {
			$('.linerUpgradeFrame').remove();
		});
	}

	hidePopup();
});

function closeUpgradeLinerPopup() {
	// Called in upgrade frame js
	$('#mask').click();
}

function showUpgradeLinerPopup(item, language) {
	if (isUpgradeItemPopupOpen == 1) {
		return;
	}
	isUpgradeItemPopupOpen = 1;

	var upgradeFrame =
	"<iframe class='linerUpgradeFrame' src= '" + window.location.origin + "/frames/upgrade.html?lang=" + language + "&item=" +
		item + "' frameborder='0' scrolling = 'no'>" +
	"</iframe>";
	$('body').append(upgradeFrame);

	$('.linerUpgradeFrame').css('width', '540px');
	$('.linerUpgradeFrame').css('height', '650px');
	$('.linerUpgradeFrame').css('left', $(window).width()/2 - $('.linerUpgradeFrame').width()/2).css('top', $(window).height()/2 - $('.linerUpgradeFrame').height()/2);
	$('.linerUpgradeFrame').css('display', 'none');
	$('.linerUpgradeFrame').css('position', 'fixed');
	$('.linerUpgradeFrame').css('background-color', '#ffffff');
	$('.linerUpgradeFrame').css('border-radius', '5px');
	$('.linerUpgradeFrame').css('box-shadow', '0 2px 4px 0 rgba(0, 0, 0, 0.5)');
	$('.linerUpgradeFrame').css('z-index', '900000');
	$('#mask').fadeIn(200);
	$('.linerUpgradeFrame').fadeIn(200);
}

function showEmailValidationPopup(showClicked, msg, top) {
	if (msg == null) {
		msg = MSG_EMAIL_VALIDATION;
	}

	var html =
	'<div class="toastPopup" style="display: none">' +
		'<div class="click"></div>' +
		'<div class="label">' + msg + '</div>' +
	'</div>';
	$('body').append(html);

	var left = $('#topView .collection').offset().left;
	$('.toastPopup').css('position', 'fixed');
	$('.toastPopup').css('width', '660px');
	$('.toastPopup').css('height', '36px');
	$('.toastPopup').css('top', top);
	$('.toastPopup').css('left', left);
	$('.toastPopup').css('z-index', '900000');
	$('.toastPopup').css('background-color', '#4de5d7');
	$('.toastPopup').css('border-radius', '5px');

	if (showClicked == 1) {
		$('.toastPopup .click').css('position', 'absolute');
		$('.toastPopup .click').css('width', '18px');
		$('.toastPopup .click').css('height', '18px');
		$('.toastPopup .click').css('top', '9px');
		$('.toastPopup .click').css('left', '248px');
		$('.toastPopup .click').css('background-image', 'url(/collection/images/clicked@2x.png)');
		$('.toastPopup .click').css('background-repeat', 'no-repeat');
		$('.toastPopup .click').css('background-size', 'cover');
		$('.toastPopup .click').css('background-position', 'center');

		$('.toastPopup .label').css('position', 'absolute');
		$('.toastPopup .label').css('top', '8px');
		$('.toastPopup .label').css('left', '272px');
	} else {
		$('.toastPopup .label').css('position', 'relative');
		$('.toastPopup .label').css('margin', '0 auto');
		$('.toastPopup .label').css('margin-top', '8px');
		$('.toastPopup .label').css('text-align', 'center');
	}
	$('.toastPopup .label').css('height', '20px');
	$('.toastPopup .label').css('font-family', 'Lato');
	$('.toastPopup .label').css('font-size', '14px');
	$('.toastPopup .label').css('font-weight', 'bold');
	$('.toastPopup .label').css('font-style', 'normal');
	$('.toastPopup .label').css('font-stretch', 'normal');
	$('.toastPopup .label').css('line-height', '1.43');
	$('.toastPopup .label').css('color', '#ffffff');

	setTimeout(function() {
		if ($('.toastPopup').length > 0) {
			$('.toastPopup').fadeIn(200);

			setTimeout(function() {
				if ($('.toastPopup').length > 0) {
					$('.toastPopup').fadeOut(200);
				}
			}, 4000);
		}
	}, 100);
}


// dropdown

function closeCollectionDropdown() {
	$('.collectionDropdown').remove();
	$('#modalPopupContainer').css('position', 'fixed');
}

function showFolderDropdown(obj, motherContainer, pageId, folders, includingFolders, folderId, fromFolder) {
	if ($('.collectionDropdown').length > 0) {
		return;
	}
	var html = '<div class="collectionDropdown">' +
					'<div class="collectionBlock">';
	if (fromFolder == 0 && folders.length == 0) {
		html += '<div class="dropdownItem small nohover">' + gLanguageObj.NO_FOLDER_YET[gLanguage] + '</div>';
	} else {
		if (fromFolder == 1) {
			html += '<div class="0 dropdownItem">My Highlights</div>';
		}
		for (var i=0;i<folders.length;i++) {
			if (folders[i].folderId != folderId) {
				var same = 0;
				for (var j=0;j<includingFolders.length;j++) {
					if (folders[i].folderId == includingFolders[j]) {
						same = 1;
						break;
					}
				}
				if (same == 0) {
					html += '<div class="' + folders[i].folderId + ' dropdownItem">' + folders[i].folderName + '</div>';
				} else {
					html += '<div class="' + folders[i].folderId + ' dropdownItem selected">' + folders[i].folderName + '</div>';
				}
			}
			if (i != folders.length - 1) {
				html += '<div class="line"></div>';
			}
		}
	}
	html += '</div></div>';
	$(motherContainer).empty();
	$(motherContainer).append(html);
	$(motherContainer).css('position', 'absolute');
	$(motherContainer).css('z-index', '0');
	$('.dropdownItem').click(function(e) {
		var className = $(this).attr('class');
		var included = 0;
		try {
			included = className.indexOf('selected');
		} catch (e) {
			included = 0;
		}
		clickFolderDropdownItem($(this), pageId, included);
	});
	var w = parseInt($(obj).css('width'));
	var h = parseInt($(obj).css('height'));
	var top = $(obj).offset().top + parseInt($(obj).css('height')) + 4;
	var left = $(obj).offset().left - 2;
	$(motherContainer).css('top', top);
	$(motherContainer).css('left', left + 'px');
	$(motherContainer).css('z-index', '10');
	$(motherContainer).hide();
	$(motherContainer).fadeIn(150);
}

function showExportDropdown(obj, motherContainer, existLabel, pageIds) {
	if ($('.collectionDropdown').length > 0) {
		return;
	}

	if (pageIds == null || pageIds == '') { // no items selected
		alert(gLanguageObj.NO_ITEMS_SELECTED[gLanguage]);
		return;
	}

	var showingLabel = 'style="display: block"';
	if (existLabel == 0) {
		showingLabel = 'style="display: none"';
	}

	var html =
	'<div class="collectionDropdown">' +
		'<div class="collectionBlock">' +
			'<div class="labelItem" ' + showingLabel + '>' + gLanguageObj.EXPORT_TO[gLanguage] + '</div>' +
			'<div class="word dropdownItem hasIcon">Word</div>' +
			'<div class="line"></div>' +
			'<div class="email dropdownItem hasIcon">Email</div>' +
			'<div class="line"></div>' +
			'<div class="goolgeDrive dropdownItem hasIcon">Google Drive</div>' +
			'<div class="line"></div>' +
			'<div class="evernote dropdownItem hasIcon">Evernote</div>' +
			'<div class="line"></div>' +
			'<div class="onenote dropdownItem hasIcon">One Note</div>' +
			'<div class="line"></div>' +
			'<div class="text dropdownItem hasIcon">Text File</div>' +
		'</div>' +
	'</div>';

	$(motherContainer).empty();
	$(motherContainer).append(html);
	$(motherContainer).css('position', 'absolute');
	$(motherContainer).css('z-index', '0');
	$('.dropdownItem').click(function(e) {
		clickExportDropdownItem($(this), pageIds);
	});
	var w = parseInt($(obj).css('width'));
	var h = parseInt($(obj).css('height'));
	var top = $(obj).offset().top + parseInt($(obj).css('height')) + 4;
	var left = $(obj).offset().left - 2;
	$(motherContainer).css('top', top);
	$(motherContainer).css('left', left + 'px');
	$(motherContainer).css('z-index', '10');
	$(motherContainer).hide();
	$(motherContainer).fadeIn(150);
}
