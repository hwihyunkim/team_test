var MENU_HIGHLIGHTS = 'highlights';
var MENU_FAVORITES = 'favorites';
var MENU_TRASH = 'trash';
var MENU_FOLDER = 'folder';
var SUB_MENU_SEARCH = 'search';
var SUB_MENU_POCKET = 'pocket_import';
var OPT_COLLECTION = 'COLLECTION';
var OPT_SEARCH = 'SEARCH';
var EMAIL_VALIDATION = 'email_validation';
var PROMO_COUPON = 'promo_coupon';
var GOOGLE_DRIVE = 'googleDrive';
var EVERNOTE = 'evernote';
var ONENOTE = 'onenote';

var PATH_HIGHLIGHTS = PATH_HOME + '/' + MENU_HIGHLIGHTS;
var PATH_FAVORITES = PATH_HOME + '/' + MENU_FAVORITES;
var PATH_TRASH = PATH_HOME + '/' + MENU_TRASH;
var PATH_FOLDER = PATH_HOME + '/' + MENU_FOLDER;
var PATH_POCKET_CALLBACK = '/auth/pocket/callback';

var WIDTH_FEATURE_PART_COUNT = 83;

var MODE_NORMAL = 0;
var MODE_EDIT = 1;
var ITEM_LIMIT = 20;
var KEY_ENTER = 13;

var gMenu = null;
var gSubMenu = null;
var gFolderId = null;
var gFolderName = null;
var gMode = MODE_NORMAL;
var gLastId = 0;
var gHighCount = 0;
var gFavorCount = 0;
var gTrashCount = 0;
var gSearchedCount = -1;
var gTimeoutCount = 0;
var gFolders = null;
var gUserInfo = null; // which item user bought
var gPurchaseInfo = null; // premium service info
var gfolderHtml =
	'<span class="icon"></span>' +
	'<span class="name"></span>';

var gListItemHtml =
	'<div class="topContainer">' +
		'<div class="favoritePart">' +
			'<div class="favoriteBtn"></div>' +
			'<div class="checkBtn"></div>' +
			'<div class="url text-ellipsis"></div>' +
		'</div>' +
		'<div class="datePart">' +
			'<div class="date"></div>' +
		'</div>' +
	'</div>' +
	'<div class="contentContainer">' +
		'<div class="textBlock">' +
			'<div class="title"></div>' +
			'<div class="highlightPart">' +
			'</div>' +
			'<div class="featurePart">' +
				'<div class="count"></div>' +
			'</div>' +
		'</div>' +
		'<div class="picBlock">' +
			'<div class="pic"></div>' +
		'</div>' +
	'</div>' +
	'<div class="functionPart">' +
		'<div class="copyLinkBtn featureBtn"></div>' +
		'<div class="facebookBtn featureBtn"></div>' +
		'<div class="twitterBtn featureBtn"></div>' +
		'<div class="exportBtn featureBtn"></div>' +
		'<div class="folderBtn featureBtn"></div>' +
		'<div class="trashBtn featureBtn"></div>' +
		'<div class="putbackBtn featureBtn"></div>' +
		'<div class="deleteBtn featureBtn"></div>' +

	'</div>';
var gBackColors = ['#ffff8d', '#fecae3', '#a7e1fb', '#a5f2e9', '#ffd5c8', '#d9c3ff'];
var isInstapaperLogin = 0;
var gLanguageObj = null;
var gLanguage = 'en';
try {
	gLanguage = Clib.setLanguage(navigator.language.substr(0, 2));
} catch (e) {
	gLanguage = 'en';
}
var gPopup = null;


$(document).ready(function() {
	setGA('collection');
	setSocial();

	if (window.location.href.indexOf(PATH_POCKET_CALLBACK) >= 0) {
		window.history.pushState('LINER', 'Collection', PATH_HIGHLIGHTS);
	}

	// get menu info from server
	gMenu = $('.hiddenMenu').text();
	gSubMenu = $('.hiddenSubMenu').text();
	gFolderId = $('.hiddenFolderId').text();
	gFolderName = $('.hiddenFolderName').text();

	$.get('/res/language/global.txt', function(data) {
		try {
			gLanguageObj = JSON.parse(data);
			localizeLanguage();
		} catch (e) {
			console.log('LINER: can\'t read global.txt file');
		}

		loadCollection();
	}, 'text');

	function loadCollection() {
		Clib.requestXHR({
			method: 'GET',
			url: '/users/me?device=Chrome_' + navigator.platform,
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					gUserInfo = JSON.parse(data.responseText);
					if (gUserInfo.photoUrl != undefined) {
						$('.userPhoto').css('background-image', 'url(' + gUserInfo.photoUrl +')').css('border', 'none');
					}
					$('.userName').text(gUserInfo.name);
					moveLeftMenuAndContents();
					$('body').css('opacity', '1');
					try {
						setSettingDropdown($('#topView .userInfo'), '#modalPopupContainer', gUserInfo.premium);
					} catch (e) {}

					showMenu();
					if (gMenu != MENU_FOLDER) {
						Clib.requestXHR({
							method: 'GET',
							url: '/users/me/highlight-count?list_type=0',
							callback: function(error, data) {
								if (JSON.parse(data.responseText).status == 'success') {
									gHighCount = JSON.parse(data.responseText).defaultPageCount;
									gFavorCount = JSON.parse(data.responseText).favoriteCount;
									gTrashCount = JSON.parse(data.responseText).trashCount;
									setTitleBlock(0, null);
								}
							}
						});

						checkIntegrationProgress();
					}

					// folder
					Clib.requestXHR({
						method: 'POST',
						url: '/folder/infos',
						callback: function(error, data) {
							if (JSON.parse(data.responseText).status == 'success') {
								gFolders = JSON.parse(data.responseText).items;
								buildFolders();
								if (gMenu == MENU_FOLDER) {
									setTitleBlock(0, null);
								}
							} else {
								window.location = '/login';
							}
						}
					});

					Clib.requestXHR({
						method: 'GET',
						url: '/purchase/sale/info',
						callback: function(error, data) {
							gPurchaseInfo = JSON.parse(data.responseText).item;
						}
					});

					Clib.requestXHR({
						method: 'GET',
						url: '/users/me/email-validation',
						callback: function(error, data) {
							if (JSON.parse(data.responseText).status == 'success') {
								var validation = JSON.parse(data.responseText).validation;
								if (validation == 0) {
									showEmailValidationInfoView();
								}
							}
						}
					});

					// show toast popup for email validation
					var emailValid = window.location.href.split('?popup=')[1];
					if (emailValid && emailValid.indexOf('&') != -1) {
						emailValid = emailValid.split('&')[0];
					}
					if (emailValid == EMAIL_VALIDATION) {
						showEmailValidationPopupRapper(1, null);
						window.history.pushState('LINER', 'Collection', PATH_HIGHLIGHTS);
						return;
					} else if (emailValid == PROMO_COUPON) {
						var duration = window.location.href.split('duration=')[1];
						var msg = gLanguageObj.MSG_FREE_PREMIUM_ACCOUNT_ACTIVATED[gLanguage].replace('%s', duration);
						showEmailValidationPopupRapper(0, msg);
						window.history.pushState('LINER', 'Collection', PATH_HIGHLIGHTS);
						return;
					}

					// process callback for export of each service
					var callbackUrl = window.location.href.split('?' + GOOGLE_DRIVE + '=')[1];
					if (callbackUrl) {
						callbackUrl = callbackUrl.replace(/[!@#$%&*()-]/gi, '');
						exportGoogleDrive(callbackUrl, 1);
						window.history.pushState('LINER', 'Collection', PATH_HIGHLIGHTS);
						return;
					}
					callbackUrl = window.location.href.split('?' + EVERNOTE + '=')[1];
					if (callbackUrl) {
						callbackUrl = callbackUrl.replace(/[!@#$%&*()-]/gi, '');
						showEmailValidationPopupRapper(0, gLanguageObj.EXPORT_SUCCESSFUL[gLanguage]);
						window.history.pushState('LINER', 'Collection', PATH_HIGHLIGHTS);
						return;
					}
					callbackUrl = window.location.href.split('?' + ONENOTE + '=')[1];
					if (callbackUrl) {
						callbackUrl = callbackUrl.replace(/[!@#$%&*()-]/gi, '');
						exportOnenote(callbackUrl, 1);
						window.history.pushState('LINER', 'Collection', PATH_HIGHLIGHTS);
						return;
					}
				} else {
					window.location = '/login';
				}
			}
		});
	}

	enableFolderSortable();
});

function showEmailValidationPopupRapper(check, msg) {
	var top = 48;
	if (gUserInfo.premium == 1) {
		top = 12;
	}
	showEmailValidationPopup(0, msg, top);
}

function showEmailValidationInfoView() {
	var h = 36;

	$('#topView').css('top', h);
	var leftMenuTop = parseInt($('#leftMenuView').css('top')) + h;
	$('#leftMenuView').css('top', leftMenuTop);
	var contentsViewTop = parseInt($('#contentsView').css('top')) + h;
	$('#contentsView').css('top', contentsViewTop);
	var manageContainerTop = parseInt($('.manageContainer').css('top')) + h;
	$('.manageContainer').css('top', manageContainerTop);

	// set email validation view
	$('#emailValidView .label').text(gLanguageObj.LABEL_EMAIL_VALIDATION[gLanguage]);
	$('#emailValidView .resendBtn').text(gLanguageObj.LABEL_RESEND[gLanguage]);

	$('#emailValidView .resendBtn').click(function() {
		Clib.requestXHR({
			method: 'POST',
			url: '/users/me/validation-email',
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					var msg = gLanguageObj.MSG_EMAIL_SENT[gLanguage] + ' ' + JSON.parse(data.responseText).email;
					showEmailValidationPopupRapper(0, msg);
				}
			}
		});
	});

	$('#emailValidView .hideBtn').click(function() {
		$('#topView').css('top', 0);
		var leftMenuTop = parseInt($('#leftMenuView').css('top')) - h;
		$('#leftMenuView').css('top', leftMenuTop);
		var contentsViewTop = parseInt($('#contentsView').css('top')) - h;
		$('#contentsView').css('top', contentsViewTop);
		var manageContainerTop = parseInt($('.manageContainer').css('top')) - h;
		$('.manageContainer').css('top', manageContainerTop);

		$('#emailValidView').hide();
	});

	$('#emailValidView').show();
}

function setSocial() {
	LinerSocial.init($, '0', '0');
}

function enableFolderSortable() {
	var adjustment;
	$('ol.folderList').sortable({
		itemSelector: 'div',

		onDrop: function ($item, container, _super) {
			var $clonedItem = $('<li/>').css({height: 0});
			$item.before($clonedItem);
			$clonedItem.animate({'height': $item.height()});

			try {
				var top = $('#leftMenuView').scrollTop();
			} catch (e) {
				top = 0;
			}
			var newPos = $clonedItem.position();
			newPos.top += top;
			newPos.left = $clonedItem.position().left;

			$item.animate(newPos, function () {
				$clonedItem.detach();
				_super($item, container);
			});

			setOrderOfFolders();
		},
		// set $item relative to cursor position
		onDragStart: function ($item, container, _super) {
			var offset = $item.offset(),
			pointer = container.rootGroup.pointer;

			adjustment = {
				left: pointer.left - offset.left,
				top: pointer.top - offset.top
			};

			_super($item, container);
		},
		onDrag: function ($item, position) {
			try {
				var top = $('#leftMenuView').scrollTop();
			} catch (e) {
				top = 0;
			}

			$item.css({
				left: position.left - adjustment.left,
				top: position.top - adjustment.top + top
			});
		}
	});
}

$(window).resize(function() {
	moveLeftMenuAndContents();
});

$(window).scroll(function() {
	if ($(window).scrollTop() == ($(document).height() - $(window).height())) {
		if (gSubMenu == SUB_MENU_SEARCH) {
			retrieveSearchList(0);
		} else {
			showMenu();
		}
	}
});

function setCheckIntegrationProgress() {
	gTimeoutCount++;
	setTimeout(checkIntegrationProgress, 60000);
}

function checkIntegrationProgress() {
	Clib.requestXHR({
		method: 'GET',
		url: '/pages/integration/progress',
		callback: function(error, data) {
			if (JSON.parse(data.responseText).status == 'success') {
				var pocket = JSON.parse(data.responseText).pocket;
				var instapaper = JSON.parse(data.responseText).instapaper;
				if (pocket == 1) {
					$('.pocketImportBtn').addClass('spin');
					setCheckIntegrationProgress();
				} else if (instapaper == 1) {
					$('.instapaperImportBtn').addClass('spin');
					setCheckIntegrationProgress();
				} else if (pocket == 0 && instapaper == 0) {
					$('.pocketImportBtn').removeClass('spin');
					$('.instapaperImportBtn').removeClass('spin');
					if (gTimeoutCount > 0) {
						if (gMenu == MENU_HIGHLIGHTS) {
							window.location.href = PATH_HOST + PATH_HIGHLIGHTS;
						}
					}
				}
			}
		}
	});
}

function checkLastImportTime(callback) {
	Clib.requestXHR({
		method: 'POST',
		url: '/pages/pocket/lastUpdatedtime',
		callback: function(error, data1) {
			if (JSON.parse(data1.responseText).status == 'success') {
				Clib.requestXHR({
					method: 'POST',
					url: '/pages/instapaper/lastUpdatedtime',
					callback: function(error, data2) {
						if (JSON.parse(data2.responseText).status == 'success') {
							var pocketTimestamp = JSON.parse(data1.responseText).timestamp;
							var instapaperTimestamp = JSON.parse(data2.responseText).timestamp;
							var modalViews = [];
							modalViews.push('#modalPopupContainer');
							if (parseInt(pocketTimestamp) != 0) {
								var timestamp = gLanguageObj.MSG_LAST_IMPORTED_TIME[gLanguage] + ': ' + Clib.convertTimestamp(pocketTimestamp).split(',')[0];
								LinerTooltip.bindElement('.pocketImportBtn', timestamp, 20, modalViews);
							} else {
								LinerTooltip.bindElement('.pocketImportBtn', gLanguageObj.MSG_POCKET_SYNC[gLanguage], 20, modalViews);
							}
							if (parseInt(instapaperTimestamp) != 0) {
								var timestamp = gLanguageObj.MSG_LAST_IMPORTED_TIME[gLanguage] + ': ' + Clib.convertTimestamp(pocketTimestamp).split(',')[0];
								LinerTooltip.bindElement('.instapaperImportBtn', timestamp, 20, modalViews);
							} else {
								LinerTooltip.bindElement('.instapaperImportBtn', gLanguageObj.MSG_POCKET_SYNC[gLanguage], 20, modalViews);
							}
							if (callback) {
								callback();
							}
						}
					}
				});
			}
		}
	});
}

function moveLeftMenuAndContents() {
	addLinerInformation();
	var LAYOUT_WIDTH = parseInt($('#leftMenuView').css('width')) + parseInt($('#contentsView').css('width')) + 21;
	var LEFT_SIDE_WIDTH = parseInt($('#leftMenuView').css('width')) + 21;
	var w = parseInt($('body').css('width'));
	var layoutLeft = (w - LAYOUT_WIDTH) / 2;
	if (layoutLeft < 0) {
		layoutLeft = 0;
	}
	$('#topView .serviceImage').css('margin-left', layoutLeft);
	var leftMenuHeight = $(window).height() - $('#topView').height() - $('.information').height() - 100;
	$('#leftMenuView').css('height', leftMenuHeight);
	$('#leftMenuView').css('left', layoutLeft);
	$('#contentsView').css('left', layoutLeft + LEFT_SIDE_WIDTH);
	$('#contentsView .listLine').css('left', layoutLeft + LEFT_SIDE_WIDTH);
	$('#contentsView .manageContainer').css('left', layoutLeft + LEFT_SIDE_WIDTH - 5);
	var userInfoRight = w - parseInt($('#contentsView').css('left')) - parseInt($('#contentsView').css('width'));
	$('#topView .userInfo').css('margin-right', userInfoRight);

	// collection tab
	$('#topView .collection').css('margin-left', '102px');

	// copyright
	var left = parseInt($('#leftMenuView').css('left'));
	$('.information').css('bottom', '24px');
	$('.information').css('left', left);
}

$(document).mouseup(function(e) {
	$('.headerTooltip').remove();

	var mother = '';
	var grandMother = '';
	try {
		mother = $(e.target).parent().attr('class');
	} catch (e) {}
	try {
		grandMother = $(e.target).parent().parent().attr('class');
	} catch (e) {}
	if ($('#leftMenuView .addFolderContainer .newName').is(':visible') &&
		mother != 'addFolderContainer') {
		$('#leftMenuView .addFolderContainer .newName').hide();
		$('#leftMenuView .addFolderContainer .name').fadeIn(150);
		return;
	} else if ($('#modalPopupContainer').is(':visible')) {
		if (mother == undefined || grandMother == undefined) {
			hidePopup();
			return;
		}
	} else if ($('#topView .searchTabContainer').is(':visible')) {
		var target = $(e.target).attr('id');
		if (target == 'topView' || target == 'mask') {
			$('.topSearch .closeBtn').click();

			if (gSearchTimer) {
				clearTimeout(gSearchTimer);
				gSearchTimer = undefined;
			}

			gSubMenu = null;
			return;
		}
	}
});

function setTitleBlock(diff, count) {
	$('.manageContainer .titleBlock .manageBtn').hide();
	var val = '';
	if (gSubMenu == SUB_MENU_SEARCH) {
		var keyword = '';
		try {
			keyword = $('#topView .search .searchInput').val().trim();
		} catch (e) { keyword = ''; }
		if (keyword != '') {
			var str = gLanguageObj.SEARCH_RESULT_FOR[gLanguage].replace('%c', Clib.commaSeparateNumber(gSearchedCount));
			val = str.replace('%s', '\'' + keyword + '\'');
		}
	} else {
		if (gMenu == MENU_HIGHLIGHTS) {
			var title = gLanguageObj.MY_HIGHLIGHTS[gLanguage];
			gHighCount += diff;
			val = title + ' (' + Clib.commaSeparateNumber(gHighCount) + ')';
		} else if (gMenu == MENU_FAVORITES) {
			val = gLanguageObj.FAVORITES[gLanguage];
			val = val + ' (' + Clib.commaSeparateNumber(gFavorCount) + ')';
		} else if (gMenu == MENU_TRASH) {
			gTrashCount += diff;
			val = gLanguageObj.TRASH[gLanguage];
			val = val + ' (' + Clib.commaSeparateNumber(gTrashCount) + ')';
		} else if (gMenu == MENU_FOLDER) {
			var index = 0;
			for (var i=0;i<gFolders.length;i++) {
				if (gFolders[i].folderId == gFolderId) {
					index = i;
					break;
				}
			}
			gFolders[index].pageCount += diff;
			var pageCount = ' (' + Clib.commaSeparateNumber(gFolders[index].pageCount) + ')';
			val = decodeURIComponent(gFolderName) + pageCount;
			if (gMode != MODE_EDIT) {
				$('.manageContainer .titleBlock .manageBtn').show();
			}
		}
	}
	$('.titleBlock .title').text(val);

	if (gMode == MODE_EDIT) {
		if (count == undefined) {
			count = 0;
		}
		var val = count + ' Selected';
		$('.titleBlock .title').text(val);
	}
}

$('.titleBlock .manageBtn').click(function(e) {
	showFolderManagePopup($(this), gFolderId, gFolderName);
});

function clickFolderDeleteButton(folderId, folderName) {
	var data = {
		folder_id: folderId,
		new_folder_status: 1
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/folder/modify',
		data: requestData,
		callback: function(error, data) {
			if (JSON.parse(data.responseText).status == 'success') {
				window.location.href = PATH_HOST + PATH_HOME;
			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
			hidePopup();
		}
	});
}

var isFolderModifying = 0;
function clickFolderDoneButton(folderId, newFolderName) {
	if (isFolderModifying == 1) {
		return;
	}
	isFolderModifying = 0;

	var data = {
		folder_id: folderId,
		new_folder_name: newFolderName,
		newFolderStatus: 0,
		language: gLanguage
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/folder/modify',
		data: requestData,
		callback: function(error, data) {
			isFolderModifying = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				window.location.href = PATH_HOST + PATH_FOLDER + '/' + folderId + '/' + newFolderName;
			} else {
				var msg = JSON.parse(data.responseText).message;
				if (msg) {
					alert(msg);
				} else {
					alert(gLanguageObj.errorMsg[gLanguage]);
				}
			}
			hidePopup();
		}
	});
}

function setMode(mode, refreshList) {
	if (refreshList == 1) {
		$('.item').removeClass('selected'); // remove item selection
		$('.favoritePart .checkBtn').removeClass('selected');
	}

	if (mode == MODE_NORMAL) { // normal mode
		$('.item').addClass('nohover');
		if (gMenu == MENU_TRASH) {
			$('.favoritePart .url').css('margin-left', '17px');
		} else {
			$('.favoritePart .favoriteBtn').show();
		}
		$('.favoritePart .checkBtn').hide();
		$('.textBlock .title').removeClass('nohover');

		$('.actionBlock .editBtn').show();
		$('.actionBlock .moveBtn').hide();
		$('.actionBlock .trashBtn').hide();
		$('.actionBlock .exportBtn').hide();
		$('.actionBlock .putbackBtn').hide();
		$('.actionBlock .deleteBtn').hide();
		$('.actionBlock .cancelBtn').hide();
	} else if (mode == MODE_EDIT) { // edit mode
		$('.item').removeClass('nohover');
		$('.favoritePart .favoriteBtn').hide();
		$('.favoritePart .checkBtn').show();
		$('.textBlock .title').addClass('nohover');

		$('.actionBlock .editBtn').hide();
		$('.actionBlock .cancelBtn').show();
		if (gMenu == MENU_HIGHLIGHTS || gMenu == MENU_FAVORITES || gSubMenu == SUB_MENU_SEARCH) {
			$('.actionBlock .moveBtn').show();
			$('.actionBlock .exportBtn').show();
			if (gSubMenu != SUB_MENU_SEARCH) {
				$('.actionBlock .trashBtn').show();
			}
			$('.actionBlock .putbackBtn').hide();
			$('.actionBlock .deleteBtn').hide();
		} else if (gMenu == MENU_TRASH) {
			$('.actionBlock .moveBtn').hide();
			$('.actionBlock .trashBtn').hide();
			$('.actionBlock .exportBtn').hide();
			$('.actionBlock .putbackBtn').show();
			$('.actionBlock .deleteBtn').show();
			$('.favoritePart .url').css('margin-left', '5px');
		} else if (gMenu == MENU_FOLDER) {
			$('.actionBlock .moveBtn').show();
			$('.actionBlock .trashBtn').show();
			$('.actionBlock .exportBtn').show();
			$('.actionBlock .putbackBtn').hide();
			$('.actionBlock .deleteBtn').hide();
		}
	} else { // error status
		alert(ERROR_MODE);
	}

	gMode = mode;
}

$('.actionBlock .editBtn').click(function(e) {
	setMode(MODE_EDIT, 1);
	setTitleBlock(0, null);
});

$('.actionBlock .cancelBtn').click(function(e) {
	hidePopup();
	setMode(MODE_NORMAL, 1);
	setTitleBlock(0, null);
});

$('.actionBlock .trashBtn').click(function(e) {
	e.preventDefault();
	if (gMenu == MENU_FOLDER) {
		if ($('#modalPopupContainer').is(':visible')) {
			hidePopup();
		} else {
			managePages(0, 2);
		}
	} else {
		managePages(0, 2);
	}
});

$('.actionBlock .exportBtn').click(function(e) {
	e.preventDefault();
	var pages = getSelectedPages();
	showExportDropdown($(this), '#modalPopupContainer', 0, pages);
});

$('.actionBlock .moveBtn').click(function(e) {
	e.preventDefault();
	if ($('#modalPopupContainer').is(':visible')) {
		hidePopup();
	} else {
		if (gMenu == 'folder') {
			showActionPopup($(this), gFolders, gFolderId, 1);
		} else {
			showActionPopup($(this), gFolders, gFolderId, 0);
		}
	}
});

$('.actionBlock .putbackBtn').click(function(e) {
	managePages(2, 0);
});

$('.actionBlock .deleteBtn').click(function(e) {
	if (confirm("Delete these highlighted pages?") == true) {
		managePages(2, 1);
	} else {
	    return;
	}
});

function showMenu() {
	var url = '';
	var method = 'POST';
	if (gMenu == MENU_HIGHLIGHTS) {
		$('.highlightsContainer > div').addClass('selected');
		$('.favoritesContainer > div').removeClass('selected');
		$('.trashContainer > div').removeClass('selected');
		$('.addFolderContainer > div').removeClass('selected');
		url = '/collection';
	} else if (gMenu == MENU_FAVORITES) {
		$('.highlightsContainer > div').removeClass('selected');
		$('.favoritesContainer > div').addClass('selected');
		$('.trashContainer > div').removeClass('selected');
		$('.addFolderContainer > div').removeClass('selected');
		url = '/users/me/favorites-new?timestamp=' + gLastId + '&limit=' + ITEM_LIMIT;
		method = 'GET';
	} else if (gMenu == MENU_TRASH) {
		$('.highlightsContainer > div').removeClass('selected');
		$('.favoritesContainer > div').removeClass('selected');
		$('.trashContainer > div').addClass('selected');
		$('.addFolderContainer > div').removeClass('selected');
		url = '/pages?limit=100&status=2';
		method = 'GET';
	} else if (gMenu == MENU_FOLDER) {
		$('.highlightsContainer > div').removeClass('selected');
		$('.favoritesContainer > div').removeClass('selected');
		$('.trashContainer > div').removeClass('selected');
		$('.addFolderContainer > div').removeClass('selected');
		$('.' + gFolderId + '-folder' + '> div').addClass('selected');
		url = '/folder/retrieve/' + gFolderId;
	}

	retrieveList(url, method);
}

function addFolderClickEventListener() {
	$('.folder').click(function(e) {
		gaEvent(GAType.COLLECTION_FOLDER);

		var id = '';
		var name = '';
		try {
			var c = $(e.target).parent().attr('class');
			id = c.split('-')[0];
			for (var i=0;gFolders.length;i++) {
				if (gFolders[i].folderId == id) {
					name = gFolders[i].folderName;
					break;
				}
			}
		} catch (e) {
			id = '';
			name = '';
		}
		if (id != '' && name != '') {
			window.location.href = PATH_HOST + PATH_FOLDER + '/' + id + '/' + encodeURIComponent(name);
		}
	});
}

function pocketInstapaperClickListener() {
	$('.pocketImportBtn').click(function(e) {
		if ($(this).hasClass('spin') || $('.instapaperImportBtn').hasClass('spin')) {
			if ($('.instapaperImportBtn').hasClass('spin')) {
				alert(gLanguageObj.MSG_PLEASE_WAIT[gLanguage]);
			}
			return;
		}

		$('.pocketImportBtn').addClass('spin');
		var requestData = Clib.getObjectSerialized({
			language: gLanguage
		});
		Clib.requestXHR({
			method: 'POST',
			url: '/pages/pocket/retrieve',
			data: requestData,
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					var count = JSON.parse(data.responseText).count;
					if (count && count > 0) {
						if (gMenu == MENU_HIGHLIGHTS) {
							window.location.href = PATH_HOST + PATH_HIGHLIGHTS;
						}
					}
					checkLastImportTime(null);
				} else {
					Clib.requestXHR({
						method: 'POST',
						url: '/auth/pocket',
						callback: function(error, data) {
							if (JSON.parse(data.responseText).status == 'success') {
								window.location.href = JSON.parse(data.responseText).authUrl;
							} else {
							}
						}
					});
				}
				$('.pocketImportBtn').removeClass('spin');
			}
		});
	});

	$('.instapaperImportBtn').click(function(e) {
		if ($(this).hasClass('spin') || $('.pocketImportBtn').hasClass('spin')) {
			if ($('.pocketImportBtn').hasClass('spin')) {
				alert(gLanguageObj.MSG_PLEASE_WAIT[gLanguage]);
			}
			return;
		}

		$('.instapaperImportBtn').addClass('spin');
		Clib.requestXHR({
			method: 'POST',
			url: '/pages/instapaper/retrieve',
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					var count = JSON.parse(data.responseText).count;
					if (count == null) {
						if (gMenu == MENU_HIGHLIGHTS) {
							window.location.href = PATH_HOST + PATH_HIGHLIGHTS;
						}
					}
					checkLastImportTime(null);
				} else {
					$('#signinPopup').fadeIn(150);
					$('.popupOverlay').fadeIn(150);
				}
				$('.instapaperImportBtn').removeClass('spin');
			}
		});
	});

	$('.closeBtn').click(function(e) {
		closeSigninPopup();
	});

	$('#passwdTxtField').click(function(e) {
		$('#passwdTxtField').val('');
	});

	$('#passwdTxtField').keydown(function (key) {
	    if (key.keyCode == 13) { // entery key
	        clickedSigninBtn();
	    }
	});

	$('#signinBtn').click(function(e) {
		clickedSigninBtn();
	});
}

var isSigningInToInstapaper = 0;
function clickedSigninBtn() {
	if (isSigningInToInstapaper == 1) {
		return;
	}
	isSigningInToInstapaper = 1;

	var email = $('#emailTxtField').val();
	var passwd = $('#passwdTxtField').val();
	var data = {
		email: email,
		passwd: passwd
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/auth/instapaper/login',
		data: requestData,
		callback: function(error, data) {
			isSigningInToInstapaper = 0;
			if (JSON.parse(data.responseText).status == 'success') {
				isInstapaperLogin = 1;
				$('.instapaperImportBtn').click();
			} else {
				isInstapaperLogin = 0;
				alert(gLanguageObj.MSG_MISS_MATCH[gLanguage]);
			}
			closeSigninPopup();
		}
	});
}

function closeSigninPopup() {
	$('#signinPopup').fadeOut(150);
	$('.popupOverlay').fadeOut(150);
	$('input:checkbox[id="instapaperImportBtn"]').prop('checked', isInstapaperLogin);
}

var isFolderCreating = 0;
function buildFolders() {
	try {
		for (var i=0;i<gFolders.length;i++) {
			var fId = gFolders[i].folderId + '-folder';
			var folder = '<div class="' + fId  + ' folder">' + gfolderHtml + '</div>';
			$('.folderList').append(folder);
			$('.' + fId + ' .name').text(gFolders[i].folderName);
		}
		addFolderClickEventListener();
	} catch (e) {}
	var addFolder =
		'<div class="addFolderContainer">' + gfolderHtml +
			'<input type="text" name="newName" class="newName" placeholder="' + gLanguageObj.PLACEHOLDER_NAME[gLanguage] +'" style="display: none">' +
		'</div>' +
		'<div class="menuSeparator"></div>' +
		'<div class="trashContainer">' +
			'<div class="icon"></div>' +
			'<div class="name">' + gLanguageObj.TRASH[gLanguage] + '</div>' +
		'</div>';

	$('#leftMenuView').append(addFolder);
	$('.addFolderContainer .name').text(gLanguageObj.ADD_FOLDER[gLanguage]);

	$('#leftMenuView .addFolderContainer').click(function(e) {
		if (gPurchaseInfo == null && $('.folder').length > 2) {
			showUpgradeLinerPopup('folder', gLanguage);
		}

		gaEvent(GAType.COLLECTION_ADD_FOLDER);
		if ($('#leftMenuView .addFolderContainer .name').is(':visible')) {
			$('#leftMenuView .addFolderContainer .name').hide();
			$('#leftMenuView .addFolderContainer .newName').val('');
			$('#leftMenuView .addFolderContainer .newName').fadeIn(150);
			$('#leftMenuView .addFolderContainer .newName').focus();
		}
	});

	$('#leftMenuView .addFolderContainer .newName').keypress(function(e) {
		if (gPurchaseInfo == null && $('.folder').length > 2) {
			$(this).blur();
			return;
		}

		if (e.which == KEY_ENTER) {
			e.preventDefault();
			var val = $('#leftMenuView .addFolderContainer .newName').val();
			if (val == '') {
				$('#leftMenuView .addFolderContainer .newName').hide();
				$('#leftMenuView .addFolderContainer .name').fadeIn(150);
			} else {
				if (isFolderCreating == 1) {
					return;
				}

				isFolderCreating = 1;
				gaEvent(GAType.COLLECTION_ADD_FOLDER_DONE);

				var data = { folder_name: val, language: gLanguage };
				var requestData = Clib.getObjectSerialized(data);
				Clib.requestXHR({
					method: 'POST',
					url: '/folder/create',
					data: requestData,
					callback: function(error, data) {
						isFolderCreating = 0;

						if (JSON.parse(data.responseText).status == 'success') {
							var fId = JSON.parse(data.responseText).folder_id + '-folder';
							gFolders.push({
								folderId: JSON.parse(data.responseText).folder_id,
								folderName: val
							});
							var folder = '<div class="' + fId  + ' folder">' + gfolderHtml + '</div>';
							$('.folderList').append(folder);
							$('.' + fId + ' .name').text(val);
							addFolderClickEventListener();
							$('#leftMenuView .addFolderContainer .newName').hide();
							$('#leftMenuView .addFolderContainer .name').fadeIn(150);
						} else {
							var msg = JSON.parse(data.responseText).message;
							if (JSON.parse(data.responseText).status == 'failed') {
								$('#leftMenuView .addFolderContainer .newName').hide();
								$('#leftMenuView .addFolderContainer .name').fadeIn(150);
								gUserInfo.free_folder = 0;
								alert(msg);
							} else {
								if (msg) {
									alert(msg);
								} else {
									alert(gLanguageObj.errorMsg[gLanguage]);
								}
							}
						}
					}
				});
			}
		}
	});

	$('#leftMenuView .trashContainer').click(function(e) {
		window.location.href = PATH_HOST + PATH_TRASH;
	});

	pocketInstapaperClickListener();
}

var isSetOrderOfFolders = 0;
function setOrderOfFolders() {
	if (isSetOrderOfFolders == 1) {
		return;
	}
	isSetOrderOfFolders = 1;

	var fObjs = $('div.folder');
	if (fObjs == 0) {
		isSetOrderOfFolders = 0;
		return;
	}

	// disable folder list when ordering in server side
	$('.folderList').css('opacity', '0.2');
	$('.folderList').css('pointer-events', 'none');

	var folderIds = [];
	for (var i=0;i<fObjs.length;i++) {
		var fid = parseInt((fObjs[i].className).split('-')[0]);
		folderIds.push(fid);
	}

	var data = {
		folder_ids: folderIds,
		desktop: 1
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'PUT',
		url: '/folder/order',
		data: requestData,
		callback: function(error, data) {
			// enable folder list
			$('.folderList').css('opacity', '1.0');
			$('.folderList').css('pointer-events', 'auto');

			isSetOrderOfFolders = 0;

			if (JSON.parse(data.responseText).status == 'success') {

			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});
}

function returnToCollectionList() {
	$('#contentsView .listContainer').empty();
	window.location.href = window.location.href;
}

var isRetrievingList = 0;
function retrieveList(url, method) {
	if (gLastId == -1) {
		return;
	}

	if (isRetrievingList == 1) {
		return;
	}
	isRetrievingList = 1;

	var data = {};
	if (method != 'GET') {
		data = {
			limit: ITEM_LIMIT,
			timestamp: gLastId,
			status: 0,
			all_type: 1,
			list_type: 0
		};
	}
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: method,
		url: url,
		data: requestData,
		callback: function(error, data) {
			isRetrievingList = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				var items = JSON.parse(data.responseText).items;
				var itemCount = JSON.parse(data.responseText).itemCount;
				gLastId = JSON.parse(data.responseText).last_id;
				if (gLastId == undefined && itemCount > 0) {
					gLastId = -1;
				}
				buildList(items, itemCount, OPT_COLLECTION);
			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});
}

function buildList(items, itemCount, opt) {
	// for search
	if (gSubMenu == SUB_MENU_SEARCH && opt == OPT_SEARCH) {
		var newItems = [];
		for (var i=0;i<itemCount;i++) {
			newItems.push({
				id: items.pageIds[i],
				hashedUrl: items.shareUrls[i],
				shareId: items.shareIds[i],
				url: items.PageUrls[i],
				imageUrl: items.imageUrls[i],
				highlights: items.highlightTexts[i],
				title: items.titles[i],
				lastUpdateTime: items.highlightRegTime[i],
				statistics: items.statistics[i],
				original: items.original[i],
				isPublic: items.isPublic[i],
				favorite: items.favorite[i]
			});
		}
		items = newItems;
	}
	for (var i=0;i<itemCount;i++) {
		if (gMenu == MENU_FAVORITES) {
			items[i].id = items[i].pageId;
		}
		createListItem(items[i], opt);
	}
	if ($('.item').length == 0) {
		createNoItem();
	}

	// add tooltip
	var modalViews = [];
	modalViews.push('#modalPopupContainer');
	LinerTooltip.bindElement('.functionPart .favoriteBtn', gLanguageObj.FAVORITE_UNFAVORITE[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .copyLinkBtn', gLanguageObj.COPY_LINK[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .facebookBtn', gLanguageObj.FACEBOOK[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .twitterBtn', gLanguageObj.TWITTER[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .trashBtn', gLanguageObj.TRASH[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .exportBtn', gLanguageObj.EXPORT[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .putbackBtn', gLanguageObj.PUT_BACK[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .deleteBtn', gLanguageObj.DELETE[gLanguage], 2, modalViews);
	LinerTooltip.bindElement('.functionPart .folderBtn', gLanguageObj.FOLDER[gLanguage], 2, modalViews);
	checkLastImportTime(null);

	setMode(gMode, 0);
	moveLeftMenuAndContents();

	setTimeout(function() {
		try {// show download popup
			if (window.Lighter == undefined || Lighter == null) {
				showDownloadPopup($('#contentsView'));
			}
		} catch (e) {
			console.log(e);
			showDownloadPopup($('#contentsView'));
		}
	}, 3000);

	// check if integration popup shows or not
	Clib.requestXHR({
		method: 'POST',
		url: '/auth/pocket/isConnected',
		callback: function(error, data) {
			if (JSON.parse(data.responseText).status == 'success') {
				if (JSON.parse(data.responseText).isLogin == -1 ||
					JSON.parse(data.responseText).isLogin == 0) {
					Clib.requestXHR({
						method: 'POST',
						url: '/auth/instapaper/isConnected',
						callback: function(error, data) {
							if (JSON.parse(data.responseText).status == 'success') {
								if (JSON.parse(data.responseText).isLogin == -1 ||
									JSON.parse(data.responseText).isLogin == 0) {
									showIntegrationPopup($('#contentsView'));
								}
							}
						}
					});
				}
			}
		}
	});

	if (gMenu == MENU_HIGHLIGHTS && gSubMenu == SUB_MENU_POCKET) {
		$('.pocketImportBtn').click();
	}
}

function createNoItem() {
	if ($('.noItemBlock').is(':visible') == true) {
		return;
	}
	var itemHTML =
		'<div class="noItemBlock">' +
			'<div class="noItemImage"></div>' +
			'<div class="noItemLabel"></div>' +
		'</div>';
	$('#contentsView .listContainer').append(itemHTML);
	if (gMenu == MENU_HIGHLIGHTS) {
		$('.noItemBlock .noItemImage').css('background-image', 'url(/collection/images/no_highlights@2x.png)');
		$('.noItemBlock .noItemLabel').text(gLanguageObj.LABEL_NO_HIGHLIGHTS[gLanguage]);
	} else if (gMenu == MENU_FAVORITES) {
		$('.noItemBlock .noItemImage').css('background-image', 'url(/collection/images/no_favorites@2x.png)');
		$('.noItemBlock .noItemLabel').text(gLanguageObj.LABEL_NO_FAVORITES[gLanguage]);
	} else if (gMenu == MENU_TRASH) {
		$('.noItemBlock .noItemImage').css('background-image', 'url(/collection/images/no_trashes@2x.png)');
		$('.noItemBlock .noItemLabel').text(gLanguageObj.LABEL_NO_TRASH[gLanguage]);
	} else { // MENU_FOLDER
		$('.noItemBlock .noItemImage').css('background-image', 'url(/collection/images/no_folders@2x.png)');
		$('.noItemBlock .noItemLabel').text(gLanguageObj.LABEL_NO_HIGHLIGHTS[gLanguage]);
	}
	var listW = parseInt($('#contentsView .listContainer').css('width'));
	var listH = parseInt($('#contentsView .listContainer').css('height'));
	var itemW = parseInt($('#contentsView .listContainer .noItemBlock').css('width'));
	var itemH = parseInt($('#contentsView .listContainer .noItemBlock').css('height'));
	var top = (listH - itemH)/4;
	var left = (listW - itemW)/2;
	$('#contentsView .listContainer .noItemBlock').css('top', top + 'px');
	$('#contentsView .listContainer .noItemBlock').css('left', left + 'px');
}

function createListItem(item, opt) {
	if (item == null || item.id == undefined) {
		return;
	}

	var itemHTML = '<div class="' + item.id + 'item item">' + gListItemHtml + '</div>';
	$('#contentsView .listContainer').append(itemHTML);

	$('.' + item.id + 'item .functionPart .copyLinkBtn').attr('share-id', item.shareId);
	$('.' + item.id + 'item .functionPart .facebookBtn').attr('share-id', item.shareId);
	$('.' + item.id + 'item .functionPart .twitterBtn').attr('share-id', item.shareId);

	if (gMenu == MENU_TRASH) {
		$('.' + item.id + 'item .functionPart .copyLinkBtn').hide();
		$('.' + item.id + 'item .functionPart .facebookBtn').hide();
		$('.' + item.id + 'item .functionPart .twitterBtn').hide();
		$('.' + item.id + 'item .functionPart .trashBtn').hide();
		$('.' + item.id + 'item .functionPart .exportBtn').hide();
		$('.' + item.id + 'item .functionPart .folderBtn').hide();
		// hide star in trash
		$('.' + item.id + 'item .favoritePart .favoriteBtn').hide();
	} else {
		$('.' + item.id + 'item .functionPart .putbackBtn').hide();
		$('.' + item.id + 'item .functionPart .deleteBtn').hide();
	}
	if (item.favorite == 1 || gMenu == MENU_FAVORITES) {
		$('.' + item.id + 'item .favoriteBtn').addClass('selected');
	}
	$('.' + item.id + 'item .url').text(item.url);
	$('.' + item.id + 'item .title').text(Clib.replaceArrow(item.title));

	var count = Math.abs(item.statistics.totalStyledItemCount - item.statistics.removedStyledItemCount);
	var itemHTML = '';
	var obj;
	try {
		obj = JSON.parse(decodeURIComponent(escape(window.atob(item.highlights))));
	} catch (e) {}
	var cnt=0;
	if (obj) {
		for (var i=0;i<obj.length;i++) {
			if (obj[i].core != undefined) {
				if (obj[i].status.length < 2) {
					var core = Clib.replaceArrow(obj[i].core);
					if (cnt < 3) {
						itemHTML +=	'<div class="highlightText"><span class="highlightSpan">' +
						core + '</span></div>';
					} else {
						itemHTML +=	'<div class="highlightText" style="display: none">' +
						'<span class="highlightSpan">' + core + '</span></div>';
					}
					cnt++;
				}
			}
		}
	}
	$('.' + item.id + 'item .highlightPart').append(itemHTML);
	$('.' + item.id + 'item .highlightPart').show();

	if (count > 3) {
		var str = '';
		if (count > 99) {
			count = 99;
		} else {
			count -= 3;
		}

		var tmp = gLanguageObj.MORE_HIGHLIGHTS[gLanguage];
		str += tmp.replace('%s', count);
		if (gLanguage == 'en' && count != 0 && count != 1) {
			str += 's';
		}
		$('.' + item.id + 'item .count').html(str);
	} else {
		if (count > 0) {
			$('.' + item.id + 'item .highlightPart').css('padding-bottom', '12px');
		}
		$('.' + item.id + 'item .featurePart').css('display', 'none');
	}
	var backColor = gBackColors[Math.floor((Math.random() * 6) + 0)];
	$('.' + item.id + 'item .pic').css('background-color', backColor);

	if (item.imageUrl) {
		$('.' + item.id + 'item .pic').css('background-image', 'url(' + item.imageUrl + ')');
	} else {
		$('.' + item.id + 'item .picBlock').hide();
	}

	if (opt == OPT_SEARCH) {
		var time = Clib.convertDate(item.lastUpdateTime.split('T')[0]);
		$('.' + item.id + 'item .date').text(time);
	} else {
		var time = Clib.convertTimestamp(item.lastUpdateTime/1000000).split(' ');
		time = time[0] + ' ' + time[1] + ' ' + time[2];
		$('.' + item.id + 'item .date').text(time);
	}

	// event listener
	$('.' + item.id + 'item .featurePart').click(function(e) {
		$('.' + item.id + 'item .highlightPart').css('padding-bottom', '12px');
		$('.' + item.id + 'item .highlightText').show();
		$(this).hide();
	});

	var favorPart = '.' + item.id + 'item .topContainer .favoritePart';
	var funcPart = '.' + item.id + 'item .functionPart';
	$(favorPart + ' .favoriteBtn').click(function() {
		gaEvent(GAType.COLLECTION_FAVORITE);
		clickFavoriteBtn(item);
	});
	$(favorPart + ' .favoriteBtn').mouseleave(function() {
		$('.' + item.id + 'item .favoriteBtn').removeClass('nohover');
	});
	$(funcPart + ' .copyLinkBtn').click(function() {
		gaEvent(GAType.COLLECTION_SHARE_COPY);
		clickedShareCopyLinkBtn($(this), item);
	});
	$(funcPart + ' .facebookBtn').click(function() {
		gaEvent(GAType.COLLECTION_SHARE_TO_FACEBOOK);
		clickedShareFacebookBtn($(this));
	});
	$(funcPart + ' .twitterBtn').click(function() {
		gaEvent(GAType.COLLECTION_SHARE_TO_TWITTER);
		clickedShareTwitterBtn($(this));
	});
	$(funcPart + ' .trashBtn').click(function() {
		gaEvent(GAType.COLLECTION_MOVE_TO_TRASH);
		managePages(0, 2, item.id);
	});
	$(funcPart + ' .trashBtn').mouseleave(function() {
		$('.' + item.id + 'item .trashBtn').removeClass('nohover');
	});
	$(funcPart + ' .exportBtn').click(function() {
		gaEvent(GAType.COLLECTION_EXPORT_DROPDOWN_MENU);
		showExportDropdown($(this), '#modalPopupContainer', 1, item.id);
	});
	$(funcPart + ' .exportBtn').mouseleave(function() {
		$('.' + item.id + 'item .exportBtn').removeClass('nohover');
	});
	$(funcPart + ' .putbackBtn').click(function() {
		gaEvent(GAType.COLLECTION_PUT_BACK);
		managePages(2, 0, item.id);
	});
	$(funcPart + ' .putbackBtn').mouseleave(function() {
		$('.' + item.id + 'item .putbackBtn').removeClass('nohover');
	});
	$(funcPart + ' .deleteBtn').click(function() {
		gaEvent(GAType.COLLECTION_DELETE);
		if (confirm(gLanguageObj.DELETE_THIS_PAGE[gLanguage]) == true){    //확인
			managePages(2, 1, item.id);
		} else{   //취소
		    return;
		}
	});
	$(funcPart + ' .deleteBtn').mouseleave(function() {
		$('.' + item.id + 'item .deleteBtn').removeClass('nohover');
	});
	$(funcPart + ' .folderBtn').click(function() {
		gaEvent(GAType.COLLECTION_FOLDER_DROPDOWN_MENU);
		var folderObj = $(this);
		var data = {
			page_id: item.id
		};
		var requestData = Clib.getObjectSerialized(data);
		Clib.requestXHR({
			method: 'POST',
			url: '/folder/include',
			data: requestData,
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					var includingFolders = JSON.parse(data.responseText).folderIds;
					if (gMenu == 'folder') {
						showFolderDropdown(folderObj, '#modalPopupContainer', item.id, gFolders, includingFolders, gFolderId, 1);
					} else {
						showFolderDropdown(folderObj, '#modalPopupContainer', item.id, gFolders, includingFolders, gFolderId, 0);
					}
				} else {
					alert(JSON.parse(data.responseText).error);
				}
			}
		});
	});
	$(funcPart + ' .folderBtn').mouseleave(function() {
		$('.' + item.id + 'item .folderBtn').removeClass('nohover');
	});

	$('.' + item.id + 'item').click(function(e) {
		var obj = $(e.target);
		for (;;) {
			try {
				if (obj.attr('class') == null) {
					break;
				} else {
					var id = obj.attr('class').split(' ')[0];
					if (gMode == MODE_NORMAL) {
						if (obj.attr('class') == 'favoritePart' || obj.attr('class') == 'functionPart' ||
							obj.attr('class') == 'featurePart') {
							break;
						}
						if (obj.attr('class').indexOf('item') >= 0) {
							try {
								if (window.getSelection().toString() != "") {
									return;
								}
							} catch(e) {
								console.log(e);
							}
							gaEvent(GAType.COLLECTION_ITEM);
							window.open($('.' + id + ' .url').text(), '_blank');
							return;
						}
					} else { // list item selection
						if (obj.attr('class').indexOf('item') >= 0) {
							if (obj.hasClass('selected')) {
								obj.removeClass('selected');
								$('.' + id + ' .checkBtn').removeClass('selected');
							} else {
								obj.addClass('selected');
								$('.' + id + ' .checkBtn').addClass('selected');
							}
							var count = $('.item.selected').length;
							setTitleBlock(0, count);
							return;
						}
					}
				}
				obj = obj.parent();
			} catch (e) {}
		}
	});
}

function detectKeyPressedForSearch() {
	gSubMenu = SUB_MENU_SEARCH;

	var keyword = $('#topView .search .searchInput').val().trim();
	if (keyword == '') {
		if (gSearchTimer) {
			clearTimeout(gSearchTimer);
			gSearchTimer = undefined;
		}
		gSubMenu = null;
		returnToCollectionList();
		return;
	}
	$('#topView .search .searchCloseBtn').hide(); // hide close button
	$('#topView .search .searchloader').show(); // show loader
	gLastId = 0;
	retrieveSearchList(1);
}

function detectSearchCloseButtonPressed() {
	$('#topView .search .searchInput').val('');
	if (gSearchTimer) {
		clearTimeout(gSearchTimer);
		gSearchTimer = undefined;
	}
	gSubMenu = null;
	returnToCollectionList();
}

function detectFocusedForSearch() {
	// hj.lee: search is free
	// if (gPurchaseInfo == null) {
	// 	showUpgradeLinerPopup('search');
	// }
}

function detectDownloadPopupClosed() {
	if ($('.integrationPopup').is(':visible')) {
		var top = $('.listContainer').offset().top + parseInt($('.downloadPopup').css('width')) - 24;
		$('#integrationPopupContainer').css('top', top + 'px');
	}
}

function clickedShareCopyLinkBtn(obj, item) {
	gaEvent(GAType.COLLECTION_SHARE_COPY);
	var shareLink = "http://lnr.li/" + obj.attr('share-id') + "/";
	Clib.copyTextToClipboard(shareLink);
	showEmailValidationPopupRapper(0, gLanguageObj.MSG_LINK_WAS_COPIED[gLanguage]);
}

function clickedShareFacebookBtn(obj) {
	gaEvent(GAType.COLLECTION_SHARE_TO_FACEBOOK);
	var shareLink = "http://lnr.li/" + obj.attr('share-id') + "/";
	LinerSocial.shareToFacebook(obj, shareLink);
}

function clickedShareTwitterBtn(obj) {
	gaEvent(GAType.COLLECTION_SHARE_TO_TWITTER);
	var shareLink = "http://lnr.li/" + obj.attr('share-id') + "/";
	LinerSocial.shareToTwitter(obj, shareLink);
}

var isFolderDropdownItemWorking = 0;
function clickFolderDropdownItem(obj, pageId, included) {
	if (isFolderDropdownItemWorking == 1) {
		return;
	}
	isFolderDropdownItemWorking = 1;

	var folderId = 0;
	var className = $(obj).attr('class');
	try {
		folderId = className.split(' ')[0];
	} catch (e) {
		folderId = 0;
	}
	if (folderId >= 0) {
		var data = {
			page_ids: pageId,
			shift_folder_id: folderId,
			desktop: 1
		};
		var url = '/folder/shift';
		if (included >= 0) {
			url = '/folder/trash';
		}
		var requestData = Clib.getObjectSerialized(data);
		Clib.requestXHR({
			method: 'POST',
			url: url,
			data: requestData,
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					var item = '.' + pageId + 'item';
					$(item).remove();
					setTitleBlock(-1, null); // decrease number of page count in the folder
					showEmailValidationPopupRapper(0, gLanguageObj.MSG_PAGE_WAS_MOVED[gLanguage]);
				} else {
					alert(JSON.parse(data.responseText).message);
				}
				isFolderDropdownItemWorking = 0;
			}
		});
	}
	closeCollectionDropdown();
}

function clickExportDropdownItem(obj, pageIds) {
	var service = '';
	try {
		var str = obj[0].className;
		service = str.split(' ')[0];
	} catch(e) {
		service = '';
	}

	if (service == 'word') {
		gaEvent(GAType.COLLECTION_EXPORT_WORD);
		exportWord(pageIds);
	} else if (service == 'email') {
		gaEvent(GAType.COLLECTION_EXPORT_EMAIL);
		exportEmail(pageIds);
	} else if (service == 'goolgeDrive') {
		gaEvent(GAType.COLLECTION_EXPORT_GOOGLE_DRIVE);
		exportGoogleDrive(pageIds, 0);
	} else if (service == 'evernote') {
		gaEvent(GAType.COLLECTION_EXPORT_EVERNOTE);
		exportEvernote(pageIds, 0);
	} else if (service == 'onenote') {
		gaEvent(GAType.COLLECTION_EXPORT_ONENOTE);
		exportOnenote(pageIds, 0);
	} else if (service == 'text') {
		gaEvent(GAType.COLLECTION_EXPORT_TXT);
		exportText(pageIds);
	} else {
		alert(gLanguageObj.errorMsg[gLanguage]);
	}

	closeCollectionDropdown();

	if (gMode == MODE_EDIT) {
		$('.item').removeClass('selected'); // remove item selection
		$('.checkBtn').removeClass('selected'); // remove item selection
	}
}

var isRetrievingSearch = 0;
function retrieveSearchList(first) {
	if (isRetrievingSearch == 1) {
		return;
	}

	isRetrievingSearch = 1;
	gaEvent(GAType.SEARCH_COLLECTION, 'Collection');

	var premium = 1; // premium service is in use
	if (gPurchaseInfo == null) {
		premium = 0;
	}
	var keyword = $('#topView .search .searchInput').val().trim();
	var data = {
		start_offset: gLastId,
		keyword: escape(keyword),
		is_mine: 1,
		premium: premium
	};
	if (first == 1) {
		data.search_type = 'count';
	}
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/search',
		data: requestData,
		callback: function(error, data) {
			isRetrievingSearch = 0;

			$('html, body').animate({scrollTop : 0}, 0); // scroll to top

			if (JSON.parse(data.responseText).status == 'success') {
				var items = JSON.parse(data.responseText);
				if (first == 1) {
					gSearchedCount = items.totalCount;
					setTitleBlock(0, null);
					moveLeftMenuAndContents();
					$('#leftMenuView').hide();
					$('#contentsView .listContainer').empty();
					$('#mask').hide();
				}
				if (items.pageIds.length > 0) {
					buildList(items, items.pageIds.length, OPT_SEARCH);
				}
				gLastId = $('.listContainer .item').length;
			} else {
				if (JSON.parse(data.responseText).status == 'failed') {
					$('#topView .topSearch .closeBtn').click();
					gUserInfo.free_search = 0;
					alert(JSON.parse(data.responseText).message);
				} else {
					alert(gLanguageObj.errorMsg[gLanguage]);
				}
			}

			$('#topView .search .searchloader').hide();
			$('#topView .search .searchCloseBtn').show();
		}
	});
}

var isFavoriting = 0;
function clickFavoriteBtn(item) {
	if (isFavoriting == 1) {
		return
	}
	isFavoriting = 1;

	var obj = $('.' + item.id + 'item .favoriteBtn');
	var url = '';
	obj.addClass('nohover');
	if (obj.hasClass('selected')) {
		obj.removeClass('selected');
		url = '/users/me/unfavorite';
	} else {
		obj.addClass('selected');
		url = '/users/me/favorites';
	}
	var data = { page_id: item.id };
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: url,
		data: requestData,
		callback: function(error, data) {
			isFavoriting = 0;

			if (JSON.parse(data.responseText).status != 'success') {
				if (obj.hasClass('selected')) {
					obj.addClass('selected');
				} else {
					obj.removeClass('selected');
				}
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});
}

var isWordExporting = 0;
function exportWord(pageIds) {
	if (isWordExporting == 1) {
		return;
	}
	isWordExporting = 1;

	// file download
	var data = {
		page_ids: pageIds,
		desktop: 1
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/export/ms/office',
		data: requestData,
		callback: function(error, data) {
			isWordExporting = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				var host = window.location.protocol + '//' + window.location.host;
			 	var filePath = JSON.parse(data.responseText).filePath;
				var itemHTML =
					'<a class="ms-office-download" href="' + host + '/files/download/'+ filePath +'" download="liner.docx"/>';
				$('body').append(itemHTML);
				$('.ms-office-download')[0].click();
				$('.ms-office-download').remove();
			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});
}

var isEmailExporting = 0;
function exportEmail(pageIds) {
	if (isEmailExporting == 1) {
		return;
	}
	isEmailExporting = 1;

	var email = gUserInfo.email;
	enterEmail(email);

	function enterEmail(defaultEmail) {
		var email = prompt(gLanguageObj.ENTER_EMAIL[gLanguage], defaultEmail);
		if (email == '') {
			alert(gLanguageObj.PLEASE_ENTER_EMAIL[gLanguage]);
			enterEmail();
		} else {
			if (email == null) {
				isEmailExporting = 0;
				return;
			}

			var data = {
				page_ids: pageIds,
				desktop: 1,
				send_to_email: 1,
				user_email: email,
				user_name: gUserInfo.name
			};
			var requestData = Clib.getObjectSerialized(data);
			Clib.requestXHR({
				method: 'POST',
				url: '/export/email',
				data: requestData,
				callback: function(error, data) {
					isEmailExporting = 0;

					if (JSON.parse(data.responseText).status == 'success') {
						showEmailValidationPopupRapper(0, gLanguageObj.EXPORT_EMAIL_SENT[gLanguage]);
					} else {
						alert(gLanguageObj.errorMsg[gLanguage]);
					}
				}
			});
		}
	}
}

var isGoogleDriveExporting = 0;
function exportGoogleDrive(pageIds, fromCallback) {
	if (fromCallback == 1) {
		processExport(pageIds);
		return;
	}

	if (isGoogleDriveExporting == 1) {
		return;
	}
	isGoogleDriveExporting = 1;

	var data = {
		originUrl: window.location.href,
		pageIds: pageIds
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/auth/google-oauth2',
		data: requestData,
		callback: function(error, data) {
			isGoogleDriveExporting = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				var url = JSON.parse(data.responseText).redirectUrl;
				if (url) {
					window.open(url);
				} else {
					processExport(pageIds);
				}
			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});

	function processExport(pageIds) {
		var data = {
			page_ids: pageIds,
			desktop: 1,
			upload_google: 1
		};
		var requestData = Clib.getObjectSerialized(data);
		Clib.requestXHR({
			method: 'POST',
			url: '/export/ms/office',
			data: requestData,
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
				 	showEmailValidationPopupRapper(0, gLanguageObj.EXPORT_SUCCESSFUL[gLanguage]);
				} else {
					alert(gLanguageObj.errorMsg[gLanguage]);
				}
			}
		});
	}
}

var isEvernoteExporting = 0;
function exportEvernote(pageIds, fromCallback) {
	if (fromCallback == 1) {
		processExport(pageIds);
		return;
	}

	if (isEvernoteExporting == 1) {
		return;
	}
	isEvernoteExporting = 1;

	processExport(pageIds);

	function processExport(pageIds) {
		var data = {
			page_id: pageIds,
			desktop: 1,
			open_window: 1,
			language: gLanguage
		};
		var requestData = Clib.getObjectSerialized(data);
		Clib.requestXHR({
			method: 'POST',
			url: '/pages/evernote',
			data: requestData,
			callback: function(error, data) {
				isEvernoteExporting = 0;

				try {
					if (JSON.parse(data.responseText).status == 'success') {
						if (JSON.parse(data.responseText).url == undefined) {
							showEmailValidationPopupRapper(0, gLanguageObj.MSG_PAGE_SAVED_TO_EVERNOTE[gLanguage]);
						} else {
							window.location.href = JSON.parse(data.responseText).url;
						}
					} else {
						alert(gLanguageObj.errorMsg[gLanguage]);
					}
				} catch (e) {
					// Check if this is Evernote sign in process
					if (data.responseURL.split('evernote.com').length != 1) {
						window.open(data.responseURL);
					} else {
						alert(gLanguageObj.errorMsg[gLanguage]);
					}
				}
			}
		});
	}
}

var isOnenoteExporting = 0;
function exportOnenote(pageIds, fromCallback) {
	if (fromCallback == 1) {
		processExport(pageIds);
		return;
	}

	if (isOnenoteExporting == 1) {
		return;
	}
	isOnenoteExporting = 1;

	var data = {
		originUrl: window.location.href,
		pageIds: pageIds
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/auth/onenote',
		data: requestData,
		callback: function(error, data) {
			isOnenoteExporting = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				var url = JSON.parse(data.responseText).redirectUrl;
				if (url) {
					window.open(url);
				} else {
					processExport(pageIds);
				}
			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});

	function processExport(pageIds) {
		var data = {
			page_ids: pageIds,
			desktop: 1,
			user_name: gUserInfo.name
		};
		var requestData = Clib.getObjectSerialized(data);
		Clib.requestXHR({
			method: 'POST',
			url: '/export/onenote',
			data: requestData,
			callback: function(error, data) {
				if (JSON.parse(data.responseText).status == 'success') {
					showEmailValidationPopupRapper(0, gLanguageObj.EXPORT_SUCCESSFUL[gLanguage]);
				} else {
					alert(gLanguageObj.errorMsg[gLanguage]);
				}
			}
		});
	}
}

var isTextExporting = 0;
function exportText(pageIds) {
	if (isTextExporting == 1) {
		return;
	}
	isTextExporting = 1;

	var data = {
		page_ids: pageIds,
		desktop: 1,
		send_to_email: 0,
		user_email: gUserInfo.email,
		user_name: gUserInfo.name
	};
	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: '/export/txt',
		data: requestData,
		callback: function(error, data) {
			isTextExporting = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				var host = window.location.protocol + '//' + window.location.host;
			 	var filePath = JSON.parse(data.responseText).filePath;
				var itemHTML =
					'<a class="txt-download" href="' + host + '/files/download/'+ filePath +'" download="liner.txt"/>';
				$('body').append(itemHTML);
				$('.txt-download')[0].click();
				$('.txt-download').remove();
			} else {
				alert(gLanguageObj.errorMsg[gLanguage]);
			}
		}
	});
}

$('#leftMenuView .highlightsContainer').click(function(e) {
	window.location.href = PATH_HOST + PATH_HIGHLIGHTS;
});

$('#leftMenuView .favoritesContainer').click(function(e) {
	window.location.href = PATH_HOST + PATH_FAVORITES;
});

function getSelectedPages() {
	var items = $('.item.selected');
	var pages = [];
	for (var i=0;i<items.length;i++) {
    	pages.push(parseInt($(items[i]).attr('class')));
	}
	return pages;
}

var isAddingToFolder = 0;

function addPagesToFolder(folderId) {
	if (isAddingToFolder == 1) {
		return;
	}

	isAddingToFolder = 1;

	var diff = 0;
	var pages = getSelectedPages();
	var data = {
		page_ids: pages,
		folder_id: folderId,
		desktop: 1
	};

	url = '/folder/shift';
	data = {
		page_ids: pages,
		shift_folder_id: folderId,
		desktop: 1
	};
	diff = -(pages.length);

	var requestData = Clib.getObjectSerialized(data);
	Clib.requestXHR({
		method: 'POST',
		url: url,
		data: requestData,
		callback: function(error, data) {
			isAddingToFolder = 0;

			if (JSON.parse(data.responseText).status == 'success') {
				if (gSubMenu != SUB_MENU_SEARCH) {
					for (var i=0;i<pages.length;i++) {
						var item = '.' + pages[i] + 'item';
						$(item).remove();
					}
				} else {
					$('.item').removeClass('selected');
					$('.item div').removeClass('selected');
				}
				setTitleBlock(diff, null);
			} else {
				alert(JSON.parse(data.responseText).message);
			}
			hidePopup();
		}
	});
}

var isManagingPages = 0;
function managePages(originStatus, newStatus, pageId) {
	if (isManagingPages == 1) {
		return;
	}
	isManagingPages = 1;

	var pages = getSelectedPages();
	if (pages.length == 0 && pageId == undefined) {
		alert(gLanguageObj.NO_ITEMS_SELECTED[gLanguage]);
		hidePopup();
	} else {
		var data = {
			page_ids: pages,
			original_status: originStatus,
			new_status: newStatus,
			desktop: 1
		};
		if (pageId) {
			var pages = [];
			pages.push(pageId);
			data.page_ids = pages;
		}
		var requestData = Clib.getObjectSerialized(data);
		Clib.requestXHR({
			method: 'PUT',
			url: '/pages',
			data: requestData,
			callback: function(error, data) {
				isManagingPages = 0;

				if (JSON.parse(data.responseText).status == 'success') {
					if (gSubMenu != SUB_MENU_SEARCH) {
						for (var i=0;i<pages.length;i++) {
							var item = '.' + pages[i] + 'item';
							$(item).remove();
						}
						var diff = -(pages.length);
						setTitleBlock(diff, null);
					} else {
						setTitleBlock(0, null);
						$('.item').removeClass('selected');
					}

					if (originStatus == 0 && newStatus == 2) {
						showEmailValidationPopupRapper(0, gLanguageObj.MSG_PAGE_WAS_DELETED[gLanguage]);
					} else if (originStatus == 2 && newStatus == 0) {
						showEmailValidationPopupRapper(0, gLanguageObj.MSG_PAGE_WAS_PUTBACK[gLanguage]);
					} else if (originStatus == 2 && newStatus == 1) {
						showEmailValidationPopupRapper(0, gLanguageObj.MSG_PAGE_WAS_PERMANENTLY_DELETED[gLanguage]);
					}
				} else {
					alert(JSON.parse(data.responseText).message);
				}
				hidePopup();
			}
		});
	}
}

function localizeLanguage() {
	var obj = gLanguageObj;

	// components
	$('#topView .collection').text(obj.HOME[gLanguage]);
	$('#topView .readingList').text(obj.READING_LIST[gLanguage]);
	$('#topView .searchInput').attr('placeholder', obj.SEARCH[gLanguage]);
	$('.highlightsContainer .name').text(obj.MY_HIGHLIGHTS[gLanguage]);
	$('.favoritesContainer .name').text(obj.FAVORITES[gLanguage]);
	$('#contentsView .actionBlock .editBtn').text(obj.BULK_EDIT[gLanguage]);
	$('#contentsView .actionBlock .moveBtn').text(obj.MOVE[gLanguage]);
	$('#contentsView .actionBlock .trashBtn').text(obj.TRASH[gLanguage]);
	$('#contentsView .actionBlock .exportBtn').text(obj.EXPORT[gLanguage]);
	$('#contentsView .actionBlock .cancelBtn').text(obj.CANCEL[gLanguage]);
	$('#contentsView .actionBlock .putbackBtn').text(obj.PUT_BACK[gLanguage]);
	$('#contentsView .actionBlock .deleteBtn').text(obj.DELETE[gLanguage]);
}
