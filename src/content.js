/**
 * Mouse Dictionary iframe support(https://github.com/wtetsu/mouse-dictionary-iframe/)
 * Copyright 2019-present wtetsu
 * Licensed under MIT
 */

import traverser from "./lib/traverser";
import letter from "./lib/rule/letter";

const main = async () => {
  if (window === window.parent) {
    return;
  }
  let _active = true;
  let _selection = null;
  let _mouseDown = false;
  let _isLastMouseUpOnTheWindow = false;

  // Fetch the current status
  chrome.runtime.sendMessage({ type: "isActive" }, response => {
    if (typeof response.isActive === "boolean") {
      _active = response.isActive;
    }
  });

  // Update the status
  chrome.runtime.onMessage.addListener(request => {
    if (typeof request.active === "boolean") {
      _active = request.active;
    }
  });

  document.body.addEventListener("mousedown", () => {
    if (!_active) {
      return;
    }
    _mouseDown = true;
  });

  document.body.addEventListener("mouseup", () => {
    if (!_active) {
      return;
    }
    chrome.runtime.sendMessage(MD_EXTENSION_ID, { type: "mouseup" });
    _mouseDown = false;
    _selection = window.getSelection().toString();
    if (_selection) {
      const SELECTION_LENGTH_LIMIT = 128;
      const text = _selection.trim().substring(0, SELECTION_LENGTH_LIMIT);
      chrome.runtime.sendMessage(MD_EXTENSION_ID, {
        type: "text",
        text: text,
        mustIncludeOriginalText: true,
        enableShortWord: false
      });
    }
  });

  const traverse = traverser.build(letter, 8);

  document.body.addEventListener("mousemove", e => {
    if (!_active) {
      return;
    }
    if (_mouseDown) {
      return;
    }
    if (_isLastMouseUpOnTheWindow && _selection) {
      return;
    }
    if (!_isLastMouseUpOnTheWindow && window.getSelection().toString()) {
      return;
    }

    const textList = traverse(e.target, e.clientX, e.clientY);

    if (!textList || textList.length == 0) {
      return;
    }

    chrome.runtime.sendMessage(MD_EXTENSION_ID, {
      type: "text",
      text: textList[0],
      mustIncludeOriginalText: false,
      enableShortWord: true
    });
  });
};

main();
