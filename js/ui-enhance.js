/* ============================================================================
   W.E.L.M — UI Enhancement Behaviour
   Vanilla JS, no dependencies, so it cannot collide with the jQuery, Owl,
   Isotope or Bootstrap bundles already on the page. Every block is guarded:
   if an element is absent the block is skipped rather than throwing.
   Remove the <script> tag to revert.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* Runs after layout has settled, including any browser scroll to a #hash
     target, so "is this element on screen?" is measured against the real
     scroll position rather than the top of the document. */
  function afterLayout(fn) {
    function go() {
      requestAnimationFrame(function () {
        requestAnimationFrame(fn);
      });
    }
    if (document.readyState === "complete") {
      go();
    } else {
      window.addEventListener("load", go, { once: true });
    }
  }

  /* -------------------------------------------------------------------------
     1. Skip-to-content link
     Keyboard users had no way past the topbar and 8-item nav on every page.
     ---------------------------------------------------------------------- */
  function addSkipLink() {
    if (document.querySelector(".welm-skip")) return;

    var target =
      document.querySelector("main") ||
      document.getElementById("welm-main") ||
      document.querySelector(".nav-bar");
    if (!target) return;

    if (!target.id) target.id = "welm-main";
    if (target.tabIndex < 0) target.tabIndex = -1;

    var link = document.createElement("a");
    link.className = "welm-skip";
    link.href = "#" + target.id;
    link.textContent = "Skip to content";
    document.body.insertBefore(link, document.body.firstChild);
  }

  /* -------------------------------------------------------------------------
     2. Sticky navbar
     The bar scrolls away normally, then re-enters as a condensed, blurred
     bar once the topbar is off screen.
     ---------------------------------------------------------------------- */
  function stickyNav() {
    var bar = document.querySelector(".nav-bar");
    if (!bar) return;

    var threshold = 140;
    var ticking = false;

    function update() {
      var stuck = window.pageYOffset > threshold;
      bar.classList.toggle("welm-stuck", stuck);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* -------------------------------------------------------------------------
     3. Current-page indicator
     Several pages carried `.active` on Home regardless of where you were, so
     the nav never showed your location. Derived from the URL instead.
     ---------------------------------------------------------------------- */
  function markActiveNav() {
    var links = document.querySelectorAll(".navbar-nav .nav-link, .navbar-nav .dropdown-item");
    if (!links.length) return;

    var here = decodeURIComponent(
      window.location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();

    var matchedTop = false;

    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.charAt(0) === "#") return;

      var file = decodeURIComponent(href.split("/").pop().split("?")[0]).toLowerCase();
      if (file !== here) return;

      if (link.classList.contains("dropdown-item")) {
        link.classList.add("active");
        // light up the parent "About" toggle too
        var parent = link.closest(".nav-item.dropdown");
        var toggle = parent && parent.querySelector(".nav-link");
        if (toggle) {
          toggle.classList.add("active");
          matchedTop = true;
        }
      } else {
        link.classList.add("active");
        matchedTop = true;
      }
    });

    // Drop the hard-coded Home highlight when we're not actually on Home.
    if (matchedTop) {
      Array.prototype.forEach.call(links, function (link) {
        var href = link.getAttribute("href");
        if (!href) return;
        var file = decodeURIComponent(href.split("/").pop().split("?")[0]).toLowerCase();
        if (file === "index.html" && here !== "index.html") {
          link.classList.remove("active");
        }
      });
    }
  }

  /* -------------------------------------------------------------------------
     4. Scroll reveal
     Sections ease up as they enter the viewport, staggered within a row.
     Content stays visible if IntersectionObserver is unavailable or the
     visitor prefers reduced motion.
     ---------------------------------------------------------------------- */
  function scrollReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    var selectors = [
      ".container .row > [class*='col-']",
      ".card.border-0",
      ".portfolio-item",
      ".section-title",
      ".section-title2"
    ];

    var seen = [];
    Array.prototype.forEach.call(
      document.querySelectorAll(selectors.join(",")),
      function (el) {
        // skip anything inside a carousel — Owl and Bootstrap both clone and
        // transform these nodes, and a stacked transform fights the slider
        if (el.closest(".owl-carousel") || el.closest(".carousel")) return;
        if (seen.indexOf(el) !== -1) return;
        seen.push(el);
      }
    );

    if (!seen.length) return;

    // Opt in to the hidden state only now that we know the script is running
    // and the observer is about to be attached.
    document.documentElement.classList.add("welm-js");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-welm-delay"), 10) || 0;
          setTimeout(function () {
            el.classList.add("welm-in");
          }, delay);
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );

    seen.forEach(function (el) {
      // stagger siblings so a row cascades instead of mounting at once
      var index = 0;
      var sib = el.previousElementSibling;
      while (sib && index < 4) {
        index++;
        sib = sib.previousElementSibling;
      }
      el.setAttribute("data-welm-delay", String(index * 90));

      // Anything already on screen at load reveals immediately, so the
      // hero area never sits blank.
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.9) {
        el.classList.add("welm-reveal", "welm-in");
      } else {
        el.classList.add("welm-reveal");
      }
      observer.observe(el);
    });

    // Safety net: nothing stays hidden for more than a moment, whatever
    // happens to the observer.
    setTimeout(function () {
      seen.forEach(function (el) {
        el.classList.add("welm-in");
      });
    }, 2500);
  }

  /* -------------------------------------------------------------------------
     5. Lazy-load images below the fold
     Several pages set `loading="lazy"` on some images but not others.
     ---------------------------------------------------------------------- */
  function normaliseLazyLoading() {
    var imgs = document.querySelectorAll("img:not([loading])");
    Array.prototype.forEach.call(imgs, function (img) {
      var box = img.getBoundingClientRect();
      if (box.top > window.innerHeight) {
        img.setAttribute("loading", "lazy");
        img.setAttribute("decoding", "async");
      }
    });
  }

  ready(function () {
    addSkipLink();
    stickyNav();
    markActiveNav();
    normaliseLazyLoading();
  });

  // Reveal waits for load so hash-linked pages measure the correct viewport.
  afterLayout(scrollReveal);
})();
