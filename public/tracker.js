;(function() {
  'use strict';
  
  // Get config from script tag data attributes
  var script = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  var config = {
    apiUrl: script.getAttribute('data-api-url') || '',
    workspaceId: script.getAttribute('data-workspace-id') || ''
  };
  
  if (!config.apiUrl || !config.workspaceId) return;
  
  function getParam(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }
  
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
  }
  
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + 24*60*60*1000*days);
    document.cookie = name + '=' + value + ';path=/;expires=' + d.toUTCString();
  }
  
  function getOrCreateId(key, persistent) {
    var val = null;
    try {
      if (persistent) {
        val = localStorage.getItem(key);
        if (!val) {
          val = Date.now().toString(36) + Math.random().toString(36).substr(2);
          localStorage.setItem(key, val);
        }
      } else {
        val = sessionStorage.getItem(key);
        if (!val) {
          val = Date.now().toString(36) + Math.random().toString(36).substr(2);
          sessionStorage.setItem(key, val);
        }
      }
    } catch(e) {}
    return val;
  }
  
  // Parse UTM params
  var utms = {
    source: getParam('utm_source'),
    medium: getParam('utm_medium'),
    campaign: getParam('utm_campaign'),
    content: getParam('utm_content'),
    term: getParam('utm_term')
  };
  
  var fbclid = getParam('fbclid');
  var fbp = getCookie('_fbp') || ('fb.1.' + Date.now() + '.' + Math.floor(Math.random()*1e9));
  var fbc = fbclid ? ('fb.1.' + Date.now() + '.' + fbclid) : getCookie('_fbc');
  
  // Set cookies
  if (!getCookie('_fbp')) setCookie('_fbp', fbp, 90);
  if (fbc && !getCookie('_fbc')) setCookie('_fbc', fbc, 90);
  
  var sessionId = getOrCreateId('_utmt_sid', false); // 30min session
  var visitorId = getOrCreateId('_utmt_vid', true);  // persistent
  
  // Persist UTMs if present
  if (utms.campaign) {
    try { sessionStorage.setItem('_utmt_utm', JSON.stringify(utms)); } catch(e) {}
  } else {
    try { 
      var stored = sessionStorage.getItem('_utmt_utm');
      if (stored) {
        var parsed = JSON.parse(stored);
        utms.source = utms.source || parsed.source;
        utms.medium = utms.medium || parsed.medium;
        utms.campaign = utms.campaign || parsed.campaign;
        utms.content = utms.content || parsed.content;
        utms.term = utms.term || parsed.term;
      }
    } catch(e) {}
  }
  
  function send(endpoint, data) {
    var url = config.apiUrl + endpoint;
    var body = JSON.stringify(data);
    if (navigator.sendBeacon) {
      var blob = new Blob([body], {type:'application/json'});
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {method:'POST',body:body,headers:{'Content-Type':'application/json'},keepalive:true}).catch(function(){});
    }
  }
  
  // Generate unique event ID
  function genEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Init session
  send('/api/tracking/session', {
    sessionId: sessionId,
    visitorId: visitorId,
    workspaceId: config.workspaceId,
    utmSource: utms.source,
    utmMedium: utms.medium,
    utmCampaign: utms.campaign,
    utmContent: utms.content,
    utmTerm: utms.term,
    fbclid: fbclid,
    fbp: fbp,
    fbc: fbc || null,
    landingPage: location.href,
    referrer: document.referrer,
    userAgent: navigator.userAgent
  });
  
  // Track PageView
  send('/api/tracking/event', {
    sessionId: sessionId,
    workspaceId: config.workspaceId,
    eventName: 'PageView',
    eventId: genEventId(),
    sourceUrl: location.href
  });
  
  // Public API
  window.utmTrack = {
    track: function(eventName, data) {
      send('/api/tracking/event', Object.assign({}, data, {
        sessionId: sessionId,
        workspaceId: config.workspaceId,
        eventName: eventName,
        eventId: genEventId(),
        sourceUrl: location.href
      }));
    },
    sessionId: sessionId,
    visitorId: visitorId
  };
})();
