/* =========================================================
   script.js — small interactive features for Ahmad's portfolio
   ---------------------------------------------------------
   What this file does:
   1. Settings you can edit (CV, email, LinkedIn)
   2. Mobile menu (open / close)
   3. Header shadow when scrolling
   4. Highlight the menu link for the section on screen
   5. Gentle fade-in animations
   6. Download CV buttons
   7. Email and LinkedIn links
   8. Pop-up notice messages
   9. Current year in the footer
   ========================================================= */


/* ---------- 1. Settings you can edit ----------
   When you have the information, change these values.
   You only need to change them here: the whole page updates. */
const SITE_SETTINGS = {
  // Step 1: put your CV PDF in the "cv" folder and name it Ahmad-CV.pdf
  // Step 2: change false to true
  cvAvailable: true,
  cvPath: "cv/Ahmad-CV.pdf",

  // Example: "name@example.com"  (leave "" until you decide)
  email: "ahmed.abouabass@gmail.com",

  // Example: "https://www.linkedin.com/in/your-profile"  (leave "" until you decide)
  linkedinUrl: "https://www.linkedin.com/in/ahmad-abou-abass"
};


/* Run everything once the page has loaded */
document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupHeaderOnScroll();
  setupActiveNavLinks();
  setupRevealAnimations();
  setupCvLinks();
  setupContactLinks();
  setFooterYear();
});


/* ---------- 2. Mobile menu ---------- */
function setupMobileMenu() {
  const toggleButton = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (!toggleButton || !nav) return;

  const buttonLabel = toggleButton.querySelector(".visually-hidden");

  function openMenu() {
    nav.classList.add("is-open");
    document.body.classList.add("menu-open");
    toggleButton.setAttribute("aria-expanded", "true");
    buttonLabel.textContent = "Close menu";
  }

  function closeMenu() {
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggleButton.setAttribute("aria-expanded", "false");
    buttonLabel.textContent = "Open menu";
  }

  // Open or close when the button is clicked
  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close the menu after choosing a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close with the Escape key, and put keyboard focus back on the button
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeMenu();
      toggleButton.focus();
    }
  });

  // If the window becomes wide (desktop menu), make sure the mobile menu is closed
  window.matchMedia("(min-width: 960px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}


/* ---------- 3. Header shadow when scrolling ---------- */
function setupHeaderOnScroll() {
  const header = document.getElementById("site-header");
  if (!header) return;

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}


/* ---------- 4. Highlight the current section in the menu ---------- */
function setupActiveNavLinks() {
  const links = document.querySelectorAll(".nav-link");
  if (!("IntersectionObserver" in window) || links.length === 0) return;

  // Find the section each menu link points to
  const sections = [];
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) sections.push(section);
  });

  // An "observer" watches the page and tells us when a section reaches
  // the middle of the screen
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const isMatch = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-active", isMatch);
          if (isMatch) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}


/* ---------- 5. Fade-in animations ---------- */
function setupRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // If the browser is old, or the visitor prefers less motion, just show everything
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // animate only once
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((item) => observer.observe(item));
}


/* ---------- 6. Download CV buttons ---------- */
function setupCvLinks() {
  const cvLinks = document.querySelectorAll("[data-cv-link]");

  cvLinks.forEach((link) => {
    if (SITE_SETTINGS.cvAvailable) {
      // CV is ready: the link downloads the PDF
      link.setAttribute("href", SITE_SETTINGS.cvPath);
      link.setAttribute("download", "");
    } else {
      // CV not added yet: show a friendly message instead of a broken link
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showNotice("My CV will be available to download here soon. In the meantime, please get in touch.");
      });
    }
  });
}


/* ---------- 7. Email and LinkedIn links ---------- */
function setupContactLinks() {
  const contactDetails = {
    email: {
      value: SITE_SETTINGS.email,
      href: "mailto:" + SITE_SETTINGS.email,
      missingMessage: "My email address will be added here soon."
    },
    linkedin: {
      value: SITE_SETTINGS.linkedinUrl,
      href: SITE_SETTINGS.linkedinUrl,
      missingMessage: "My LinkedIn profile link will be added here soon."
    }
  };

  document.querySelectorAll("[data-contact]").forEach((link) => {
    const detail = contactDetails[link.dataset.contact];
    if (!detail) return;

    if (detail.value) {
      // The detail has been filled in: make the link work
      link.setAttribute("href", detail.href);
      if (link.dataset.contact === "linkedin") {
        link.setAttribute("target", "_blank");     // open in a new tab
        link.setAttribute("rel", "noopener");      // safer for new tabs
      }
    } else {
      // Not filled in yet: show a message instead
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showNotice(detail.missingMessage);
      });
    }
  });

  // Replace the placeholder text with the real details (when provided)
  document.querySelectorAll("[data-contact-text]").forEach((element) => {
    const detail = contactDetails[element.dataset.contactText];
    if (detail && detail.value) {
      element.textContent = detail.value.replace(/^https?:\/\/(www\.)?/, "");
    }
  });
}


/* ---------- 8. Pop-up notice messages ---------- */
let noticeTimer;

function showNotice(message) {
  const notice = document.getElementById("site-notice");
  if (!notice) return;

  notice.textContent = message;
  notice.classList.add("is-visible");

  // Hide the message again after 5 seconds
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.classList.remove("is-visible");
  }, 5000);
}


/* ---------- 9. Current year in the footer ---------- */
function setFooterYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
