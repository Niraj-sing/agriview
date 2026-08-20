(function () {
  "use strict";

  var API_BASE = window.AGRIVIEW_API_BASE || "https://api.agriview.in";

  function byId(id) { return document.getElementById(id); }
  function setStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = "form-status show " + (type || "");
  }
  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = busyText || "Sending…";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || "Submit";
    }
  }
  async function postJSON(endpoint, payload) {
    var response = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    var data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
    return data;
  }

  var year = byId("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Sticky header + back to top */
  var header = byId("siteHeader");
  var toTop = byId("toTop");
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 500);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* Mobile menu */
  var navToggle = byId("navToggle");
  var mobileMenu = byId("mobileMenu");
  function closeMenu() {
    if (!mobileMenu || !navToggle) return;
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!btn || !panel) return;
    function setState(open) {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    }
    setState(item.classList.contains("is-open"));
    btn.addEventListener("click", function () {
      setState(!item.classList.contains("is-open"));
    });
    window.addEventListener("resize", function () {
      if (item.classList.contains("is-open")) panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });

  /* Support form -> Cloudflare Worker */
  var supportForm = byId("supportForm");
  if (supportForm) {
    var supportStatus = byId("supportStatus");
    supportForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var name = byId("sName").value.trim();
      var email = byId("sEmail").value.trim();
      var subject = byId("sSubject").value;
      var message = byId("sMessage").value.trim();
      var honeypot = byId("supportFormWebsite");
      var button = supportForm.querySelector("button[type='submit']");

      if (honeypot && honeypot.value) return;
      if (!name || !email || !subject || !message) {
        setStatus(supportStatus, "Please fill in every field before sending.", "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus(supportStatus, "Please enter a valid email address.", "err");
        return;
      }

      setBusy(button, true, "Sending…");
      try {
        await postJSON("/support", { name: name, email: email, subject: subject, message: message });
        supportForm.reset();
        setStatus(supportStatus, "Message sent successfully. Our support team will review it.", "ok");
      } catch (err) {
        setStatus(supportStatus, err.message, "err");
      } finally {
        setBusy(button, false);
      }
    });
  }

  /* Delete-account request -> Cloudflare Worker */
  var deleteForm = byId("deleteForm");
  if (deleteForm) {
    var deleteStatus = byId("deleteStatus");
    deleteForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var name = byId("dName").value.trim();
      var contact = byId("dEmail").value.trim();
      var reason = byId("dReason").value.trim();
      var confirmed = byId("dConfirm").checked;
      var honeypot = byId("deleteFormWebsite");
      var button = deleteForm.querySelector("button[type='submit']");

      if (honeypot && honeypot.value) return;
      if (!name || !contact || !confirmed) {
        setStatus(deleteStatus, "Please complete the required fields and confirm before submitting.", "err");
        return;
      }

      setBusy(button, true, "Submitting…");
      try {
        await postJSON("/delete-account", {
          name: name,
          contact: contact,
          reason: reason,
          confirm: true
        });
        deleteForm.reset();
        setStatus(deleteStatus, "Deletion request submitted successfully. We may contact you to verify ownership before deletion.", "ok");
      } catch (err) {
        setStatus(deleteStatus, err.message, "err");
      } finally {
        setBusy(button, false);
      }
    });
  }
})();
