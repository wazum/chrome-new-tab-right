let WindowTabIdsIndex = {};
let ActiveWindowId = -1;
let ActiveTabIndex = 0;

chrome.windows.getAll({
	populate: true
}, function (windows) {
	for (let i = 0; i < windows.length; i++) {
		let windowId = windows[i].id;
		WindowTabIdsIndex[windowId] = {};
		if (windows[i].focused) {
			ActiveWindowId = windowId;
		}
		for (let j = 0; j < windows[i].tabs.length; j++) {
			WindowTabIdsIndex[windowId][windows[i].tabs[j].id] = windows[i].tabs[j].index;
			if (windows[i].tabs[j].active) {
				ActiveTabIndex = windows[i].tabs[j].index;
			}
		}
	}
});

chrome.tabs.onCreated.addListener(function (tab) {
	let index = ActiveTabIndex;
	let windowId = tab.windowId;
	if (typeof WindowTabIdsIndex[windowId] === 'undefined') {
		WindowTabIdsIndex[windowId] = {};
	}
	updateWindowTabIndex(windowId);
	if (WindowTabIdsIndex[windowId].length === 0) {
		return;
	}
	if (windowId == tab.windowId) {
		chrome.tabs.move(tab.id, {
			index: index + 1
		});
	} else {
		return;
	}
	chrome.tabs.update(tab.id, {
		selected : true
	});
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	let tabId = activeInfo.tabId;
	let windowId = activeInfo.windowId;
	if (typeof WindowTabIdsIndex[windowId] !== 'undefined' &&
		typeof WindowTabIdsIndex[windowId][tabId] !== 'undefined') {
		ActiveTabIndex = WindowTabIdsIndex[windowId][tabId];
	} else {
		ActiveTabIndex = 0;
	}
});

chrome.windows.onRemoved.addListener(function (windowId) {
	WindowTabIdsIndex[windowId] = undefined;
	delete WindowTabIdsIndex[windowId];
	if (windowId == ActiveWindowId) {
		ActiveWindowId = -1;
	}
});

chrome.windows.onFocusChanged.addListener(function (windowId) {
	ActiveWindowId = windowId;
	updateWindowTabIndex(windowId);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	if (removeInfo.isWindowClosing === false) {
		updateWindowTabIndex(removeInfo.windowId);
	}
});

chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
	updateWindowTabIndex(moveInfo.windowId);
});

chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
	updateWindowTabIndex(detachInfo.oldWindowId);
});

function updateWindowTabIndex(windowId) {
	chrome.windows.get(windowId, { populate: true }, function (window) {
		for (let i = 0; i < window.tabs.length; i++) {
			WindowTabIdsIndex[windowId][window.tabs[i].id] = window.tabs[i].index;
			if (window.tabs[i].active) {
				ActiveTabIndex = window.tabs[i].index;
			}
		}
	});
}
