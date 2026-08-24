(function() {
  /* ==========================================================================
     1. POMOCNÉ FUNKCE A SCROLLOVÁNÍ
  ========================================================================== */
  const select = (el, all = false) => {
    if (!el) return null;
    el = el.trim();
    return all ? [...document.querySelectorAll(el)] : document.querySelector(el);
  };

  const onscroll = (el, listener) => {
    if (el) el.addEventListener('scroll', listener);
  };

  const scrollto = (el) => {
    const targetElement = select(el);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* ==========================================================================
     2. SAMOSTATNÝ A PLNĚ NEZÁVISLÝ ODPOČET ČASU
  ========================================================================== */
  function initCountdowns() {
    const countdownItems = document.querySelectorAll('.countdown-item, .card-countdown');
    if (countdownItems.length === 0) return;

    countdownItems.forEach(item => {
      const targetDateStr = item.getAttribute('data-end-date') || item.getAttribute('data-date');
      if (!targetDateStr) return;

      const targetTime = new Date(targetDateStr).getTime();
      if (isNaN(targetTime)) return;

      const numbers = item.querySelectorAll('.number, .card-timer span');
      if (numbers.length < 4) return;

      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        numbers[0].textContent = '00';
        numbers[1].textContent = '00';
        numbers[2].textContent = '00';
        numbers[3].textContent = '00';
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      numbers[0].textContent = String(days).padStart(2, '0');
      numbers[1].textContent = String(hours).padStart(2, '0');
      numbers[2].textContent = String(minutes).padStart(2, '0');
      numbers[3].textContent = String(seconds).padStart(2, '0');
    });
  }

  /* ==========================================================================
     LOGIKA KARET (POSTUPNÉ ODEMYKÁNÍ)
  ========================================================================== */
  function initCardsLogic() {
    const cards = select(".challenge-card", true);
    if (cards.length === 0) return;

    const now = new Date().getTime();
    let activeCardFound = false;

    cards.forEach((card) => {
      const dateAttr = card.getAttribute("data-date");
      const endDateAttr = card.getAttribute("data-end-date");
      const winnerAttr = card.getAttribute("data-winner");

      if (!dateAttr || !endDateAttr) return;

      const startDate = new Date(dateAttr).getTime();
      const endDate = new Date(endDateAttr).getTime();

      const lockedContent = card.querySelector(".locked-content");
      const unlockedContent = card.querySelector(".unlocked-content");
      const votingArea = card.querySelector(".voting-area");
      const countdownArea = card.querySelector(".card-countdown");
      let endedArea = card.querySelector(".ended-area");

      // Reset tříd
      card.classList.remove("active", "locked", "unlocked", "ended");

      // Pomocná funkce pro bezpečné nastavení display přímo v JS
      const setDisplay = (lockedDisplay, unlockedDisplay) => {
        if (lockedContent) lockedContent.style.display = lockedDisplay;
        if (unlockedContent) unlockedContent.style.display = unlockedDisplay;
      };

      // 1. Hlasování u této karty již skončilo
      if (now >= endDate) {
        card.classList.add("ended", "unlocked");
        setDisplay("none", "block");
        if (votingArea) votingArea.style.display = "none";
        if (countdownArea) countdownArea.style.display = "none";

        if (!endedArea) {
          endedArea = document.createElement("div");
          endedArea.className = "ended-area";
          if (unlockedContent) {
            unlockedContent.appendChild(endedArea);
          } else {
            card.appendChild(endedArea);
          }
        }
        endedArea.style.display = "block";
        endedArea.innerHTML = `
          <div class="status-ended-box" style="text-align: center; padding: 20px 15px; background: #ffffff; backdrop-filter: blur(6px); margin-top: 0; border-radius: 0 0 16px 16px;">
            <h4 style="margin: 0 0 8px 0; color: #33007B; text-transform: uppercase; font-size: 1rem;">Hlasování ukončeno</h4>
            ${winnerAttr ? `<p style="margin: 0; font-weight: 700; font-size: 1rem; text-align: center; color: #33007B;">Vítěz: <span style="color: #33007B;">${winnerAttr}</span></p>` : ''}
          </div>
        `;
      } 
      // 2. Karta právě probíhá (aktivní) - Povolíme POUZE PRO PRVNÍ TAKOVOU V POŘADÍ
      else if (now >= startDate && now < endDate && !activeCardFound) {
        activeCardFound = true;
        card.classList.add("active", "unlocked");
        setDisplay("none", "block");
        if (votingArea) votingArea.style.display = "block";
        if (countdownArea) countdownArea.style.display = "block";
        if (endedArea) endedArea.style.display = "none";
      } 
      // 3. Všechny ostatní (budoucí nebo pokud už aktivní kartu máme) -> ZAMČENÉ
      else {
        card.classList.add("locked");
        setDisplay("flex", "none");
        if (endedArea) endedArea.style.display = "none";
      }
    });

    // Pojistka: Pokud nebyla nalezena žádná aktivní karta, vezme se první v pořadí, která ještě neskončila, a aktivuje se.
    if (!activeCardFound) {
      const firstNotEnded = cards.find(c => !c.classList.contains("ended"));
      if (firstNotEnded) {
        firstNotEnded.classList.remove("locked");
        firstNotEnded.classList.add("active", "unlocked");
        
        const lc = firstNotEnded.querySelector(".locked-content");
        const uc = firstNotEnded.querySelector(".unlocked-content");
        const votingArea = firstNotEnded.querySelector(".voting-area");
        const countdownArea = firstNotEnded.querySelector(".card-countdown");
        const endedArea = firstNotEnded.querySelector(".ended-area");
        
        if (lc) lc.style.display = "none";
        if (uc) uc.style.display = "block";
        if (votingArea) votingArea.style.display = "block";
        if (countdownArea) countdownArea.style.display = "block";
        if (endedArea) endedArea.style.display = "none";
      }
    }
  }

  /* ==========================================================================
     3. INICIALIZACE ZBYTKU WEBU
  ========================================================================== */
  function initMain() {
    const selectNavbar = select('#navbar');
    if (selectNavbar) {
      const navbarScrolled = () => {
        if (window.scrollY > 100) {
          selectNavbar.classList.add('navbar-scrolled');
        } else {
          selectNavbar.classList.remove('navbar-scrolled');
        }
      };
      navbarScrolled();
      onscroll(window, navbarScrolled);
    }

    const navbarlinks = select('#navbar .scrollto', true);
    const navbarlinksActive = () => {
      let position = window.scrollY + 200;
      navbarlinks.forEach(navbarlink => {
        if (!navbarlink.hash) return;
        let section = select(navbarlink.hash);
        if (!section) return;
        if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
          navbarlink.classList.add('active');
        } else {
          navbarlink.classList.remove('active');
        }
      });
    };
    navbarlinksActive();
    onscroll(window, navbarlinksActive);

    const menu = select(".menu");
    const hamburger = select(".hamburger");
    const menuIcon = select(".svg-menu");
    const closeIcon = select(".svg-menu-close");
    const allAnchorLinks = select('a[href^="#"]', true);

    function toggleMenu() {
      if (!menu || !menuIcon || !closeIcon || !hamburger) return;

      menu.classList.toggle("showMenu");
      const isMenuNowOpen = menu.classList.contains("showMenu");
      hamburger.setAttribute("aria-expanded", isMenuNowOpen);
      
      if (isMenuNowOpen) {
        closeIcon.style.display = "block";
        menuIcon.style.display = "none";
      } else {
        closeIcon.style.display = "none";
        menuIcon.style.display = "block";
      }
    }

    if (hamburger) {
      hamburger.addEventListener("click", toggleMenu);
    }

    allAnchorLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (menu && menu.classList.contains("showMenu")) {
          toggleMenu();
        }
        if (href && href.startsWith("#") && href !== "#") {
          e.preventDefault();
          scrollto(href);
        }
      });
    });

    initCardsLogic();
    initCountdowns();
    setInterval(initCountdowns, 1000);
    setInterval(initCardsLogic, 5000);

    const modal = select("#vote-modal");
    const modalCloseBtn = select("#modal-close");
    const candidateText = select("#selected-candidate");
    const candidateInput = select("#candidate-input");
    const voteForm = select("#vote-form");
    const modalMsg = select("#modal-msg");

    function showModalMsg(text, isError = true) {
      if (!modalMsg) return;
      modalMsg.textContent = text;
      modalMsg.style.display = "block";
      modalMsg.style.padding = "0px";
      modalMsg.style.marginBottom = "15px";
      modalMsg.style.fontSize = "14px";
      modalMsg.style.textAlign = "center";

      if (isError) {
        modalMsg.style.color = "#ff4d4d";
      } else {
        modalMsg.style.color = "#2ecc71";
      }
    }

    function clearModalMsg() {
      if (!modalMsg) return;
      modalMsg.textContent = "";
      modalMsg.style.display = "none";
    }

    function openModal(candidateName) {
      if (!modal) return;

      const activeCard = select(".challenge-card.active");
      const challengeId = activeCard ? (activeCard.getAttribute("data-id") || "global-vote") : "global-vote";

      const selectionWrapper = candidateText ? candidateText.parentElement : null;

      if (localStorage.getItem(`voted_${challengeId}`) === "true") {
        modal.classList.add("is-open");
        modal.style.display = "flex";
        if (voteForm) voteForm.style.display = "none";
        
        if (selectionWrapper) {
          selectionWrapper.style.display = "none";
        }

        showModalMsg("Z tohoto zařízení již byl hlas v této výzvě odeslán. Děkujeme!", false);
        return;
      }

      if (selectionWrapper) {
        selectionWrapper.style.display = "block";
      }

      const cleanName = candidateName ? candidateName.replace(/\s+/g, ' ').trim() : '';
      if (candidateText) candidateText.textContent = cleanName;
      if (candidateInput) candidateInput.value = cleanName;
      
      clearModalMsg();
      if (voteForm) voteForm.style.display = "block";

      modal.classList.add("is-open");
      modal.style.display = "flex";
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.style.display = "none";
      clearModalMsg();
      if (voteForm) {
        voteForm.reset();
        voteForm.style.display = "block";
      }

      const selectionWrapper = candidateText ? candidateText.parentElement : null;
      if (selectionWrapper) {
        selectionWrapper.style.display = "block";
      }
    }

    document.documentElement.addEventListener("click", (e) => {
      const voteBtn = e.target.closest(".btn-vote");
      if (voteBtn) {
        e.preventDefault();
        openModal(voteBtn.innerText || voteBtn.textContent);
      }
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.classList.contains("modal-overlay")) {
          closeModal();
        }
      });
    }

    if (voteForm) {
      voteForm.setAttribute("novalidate", "true");

      voteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearModalMsg();
        
        const nameInput = select("#user-name");
        const emailInput = select("#voter-email") || select("#user-email");
        const termsCheckbox = select("#terms-agree");

        if (!nameInput || !nameInput.value.trim()) {
          showModalMsg("Vyplňte prosím vaše jméno a příjmení.");
          if (nameInput) nameInput.focus();
          return;
        }

        if (!emailInput || !emailInput.value.trim()) {
          showModalMsg("Vyplňte prosím váš e-mail.");
          if (emailInput) emailInput.focus();
          return;
        }

        if (termsCheckbox && !termsCheckbox.checked) {
          showModalMsg("Pro odeslání hlasu musíte souhlasit se zpracováním osobních údajů.");
          if (termsCheckbox) termsCheckbox.focus();
          return;
        }

        const formData = {
          candidate: candidateInput ? candidateInput.value : "",
          fullname: nameInput.value.trim(),
          email: emailInput.value.trim(),
          termsAccepted: termsCheckbox ? termsCheckbox.checked : false
        };

        const activeCard = select(".challenge-card.active");
        const challengeId = activeCard ? (activeCard.getAttribute("data-id") || "global-vote") : "global-vote";
        localStorage.setItem(`voted_${challengeId}`, "true");

        voteForm.style.display = "none";

        showModalMsg(`Děkujeme za hlas pro kandidáta: ${formData.candidate}!`, false);
        
        setTimeout(() => {
          closeModal();
        }, 2500);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMain);
  } else {
    initMain();
  }
})();