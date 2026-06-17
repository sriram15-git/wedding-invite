/* ==========================================================================
   WEDDING INVITATION MAIN INTERACTION ENGINE
   ========================================================================== */

// 1. CONFIGURATION & CONSTANTS
// EDITABLE: Set your wedding details here
const WEDDING_CONFIG = {
  brideName: "Radhika P",
  groomName: "Karthik Raaja D",
  // Format: YYYY-MM-DDTHH:mm:ss (Chennai timezone/local time)
  weddingDate: "2026-08-30T06:30:00",
  venueName: "Ramakrish Palace, Chennai",
  venueAddress: "110, Grand Southern Trunk Rd, Chromeper, Chennai - 600044",
  // Dynamic switcher: Local file backend when running locally, cloud database when deployed online
  wishesDbUrl:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "/api/wishes"
      : "https://kvdb.io/A4r9M2B8u6c3D1z9fG8p/wedding_karthik_radhika_2026",
};

// Default fallback blessings in case db is empty or network is offline
const DEFAULT_WISHES = [
  {
    name: "Kritthvik R D",
    attendance: "yes-dance",
    wishes:
      "Congratulations Chithappa and chithi! So happy for you two. ! ✨ Assign a prsn to babysit me, and you guys can dance💃",
    timestamp: Date.now() - 3600000 * 2,
  },
];

document.addEventListener("DOMContentLoaded", () => {
  // Init core features
  initOpeningScreen();
  initScratchCard();
  initCountdown();
  initCustomSelect();
  initWishesWall();
  initSectionObservers();
  initUtilityControls();
});

// 2. OPENING SCREEN & AUDIO AUTO-PLAY BYPASS
function initOpeningScreen() {
  const btnOpen = document.getElementById("btn-open-invite");
  const openingScreen = document.getElementById("opening-screen");
  const appContainer = document.getElementById("appContainer");
  const bgMusic = document.getElementById("bg-music");

  btnOpen.addEventListener("click", () => {
    // Play audio immediately upon user gesture (bypasses browser autoplay restrictions)
    bgMusic
      .play()
      .then(() => {
        console.log("Audio playing successfully.");
      })
      .catch((err) => {
        console.log("Audio play failed, user gesture required:", err);
      });

    // Fade out opening screen
    openingScreen.classList.add("fade-out-open");

    // Unlock vertical scroll of invitation container
    appContainer.style.overflowY = "auto";

    // Immediately smooth scroll to the Welcome Page
    const welcomePage = document.getElementById("welcome-page");
    if (welcomePage) {
      welcomePage.scrollIntoView({ behavior: "smooth" });
    }

    // Set display none after fade-out transition completes to lock it out
    setTimeout(() => {
      openingScreen.style.display = "none";
    }, 1000);

    // Trigger visual opening effects (launch a greeting firework)
    if (window.weddingEffects) {
      setTimeout(() => {
        window.weddingEffects.launchFirework();
      }, 1200);
    }
  });
}

// 3. SCRATCH-TO-REVEAL DATE ENGINE
function initScratchCard() {
  const scratchArea = document.getElementById("scratchArea");
  const canvas = document.getElementById("scratch-canvas");
  const afterScratchBtn = document.getElementById("btn-after-scratch");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let isDrawing = false;
  let scratchedPercent = 0;
  let isRevealed = false;

  // Set canvas size to match layout container bounding box
  const rect = scratchArea.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Draw gold foil gradient cover on canvas
  function drawGoldFoil() {
    // Create a beautiful metallic gold gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#BF953F");
    grad.addColorStop(0.25, "#FCF6BA");
    grad.addColorStop(0.5, "#B38728");
    grad.addColorStop(0.75, "#FBF5B7");
    grad.addColorStop(1, "#AA771C");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional texture: Draw soft golden dots for texture
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 500; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2,
      );
    }

    // Draw instructional text on the foil
    ctx.fillStyle = "#0B0B0B";
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦ SCRATCH HERE ✦", canvas.width / 2, canvas.height / 2 - 15);

    ctx.font = 'italic 12px "Poppins", sans-serif';
    ctx.fillText(
      "to reveal the wedding date",
      canvas.width / 2,
      canvas.height / 2 + 15,
    );
  }

  // Load the custom gold texture if it exists, otherwise fall back to computed gradient
  const texture = new Image();
  texture.src = "assets/gold-scratch-texture.png";
  texture.onload = () => {
    ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);
    // Overlay text
    ctx.fillStyle = "#0B0B0B";
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.textAlign = "center";
    ctx.fillText("✦ SCRATCH HERE ✦", canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = 'italic 12px "Poppins", sans-serif';
    ctx.fillText(
      "to reveal the wedding date",
      canvas.width / 2,
      canvas.height / 2 + 15,
    );
  };
  texture.onerror = () => {
    // If image fails, draw the custom CSS-like gold gradient
    drawGoldFoil();
  };

  // Scratch Action (Drawing destination-out circles)
  function scratch(x, y) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    checkScratchPercentage();
  }

  // Event handlers for both Mouse and Touch inputs
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    // Touch support
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    // Mouse support
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    const pos = getCoordinates(e);
    scratch(pos.x, pos.y);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    scratch(pos.x, pos.y);
  });

  window.addEventListener("mouseup", () => {
    isDrawing = false;
  });

  canvas.addEventListener("touchstart", (e) => {
    isDrawing = true;
    const pos = getCoordinates(e);
    scratch(pos.x, pos.y);
  });

  canvas.addEventListener("touchmove", (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent page scrolling while scratching
    const pos = getCoordinates(e);
    scratch(pos.x, pos.y);
  });

  canvas.addEventListener("touchend", () => {
    isDrawing = false;
  });

  // Calculate percentage of canvas scratched to trigger auto-reveal
  function checkScratchPercentage() {
    if (isRevealed) return;

    // Sample 1 out of every 32 pixels to optimize performance on mobile
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const total = pixels.length / 4;
    let transparentCount = 0;

    for (let i = 0; i < pixels.length; i += 128) {
      if (pixels[i + 3] === 0) {
        // Alpha is transparent
        transparentCount++;
      }
    }

    scratchedPercent = (transparentCount / (total / 32)) * 100;

    // Once scratched 45%+, reveal fully
    if (scratchedPercent >= 45) {
      isRevealed = true;
      revealDate();
    }
  }

  function revealDate() {
    // Fade out canvas using CSS
    canvas.style.transition = "opacity 0.8s ease-out";
    canvas.style.opacity = "0";

    setTimeout(() => {
      canvas.remove();
      // Reveal the button to move to countdown
      afterScratchBtn.classList.remove("hidden-btn");
      afterScratchBtn.classList.add("fade-in-up");

      // Launch a celebration of fireworks!
      if (window.weddingEffects) {
        window.weddingEffects.launchFirework();
        setTimeout(() => window.weddingEffects.launchFirework(), 400);
        setTimeout(() => window.weddingEffects.launchFirework(), 800);
      }
    }, 800);
  }
}

// 4. WEDDING LIVE COUNTDOWN ENGINE
function initCountdown() {
  const targetDate = new Date(WEDDING_CONFIG.weddingDate).getTime();

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  function updateTimer() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      // Wedding started!
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minutesEl.innerText = "00";
      secondsEl.innerText = "00";
      return;
    }

    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((difference % (1000 * 60)) / 1000);

    // Format numbers to always display 2 digits
    daysEl.innerText = d.toString().padStart(2, "0");
    hoursEl.innerText = h.toString().padStart(2, "0");
    minutesEl.innerText = m.toString().padStart(2, "0");
    secondsEl.innerText = s.toString().padStart(2, "0");
  }

  // Update timer instantly, then update every second
  updateTimer();
  setInterval(updateTimer, 1000);
}

// 5. WISHES WALL (GUESTBOOK) & RSVP DATABASE SYNCING
async function initWishesWall() {
  const rsvpForm = document.getElementById("rsvpForm");
  const wishesList = document.getElementById("wishesList");
  const wishesLoader = document.getElementById("wishesLoader");
  const formContainer = document.getElementById("rsvp-form-container");
  const successScreen = document.getElementById("rsvp-success");

  // Persistent storage check: Hide RSVP form if already submitted in past sessions
  if (localStorage.getItem("my_rsvp_submitted") === "true") {
    formContainer.classList.add("hidden");
    successScreen.classList.remove("hidden");
  }

  // Load existing wishes from KVDB.io cloud database (with local fallback)
  async function fetchWishes() {
    try {
      const response = await fetch(WEDDING_CONFIG.wishesDbUrl);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else if (response.status === 404) {
        // DB not created yet, return defaults
        return DEFAULT_WISHES;
      }
    } catch (err) {
      console.warn(
        "Unable to connect to Wishes Database, using local storage fallback:",
        err,
      );
    }

    // Fallback: local storage
    const localData = localStorage.getItem("wedding_wishes");
    return localData ? JSON.parse(localData) : DEFAULT_WISHES;
  }

  // Save wish to local backend or cloud database depending on environment
  async function saveWish(newWish, wishesArray) {
    localStorage.setItem("wedding_wishes", JSON.stringify(wishesArray));
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocal) {
        // Local: POST single new wish (python server handles appending)
        await fetch(WEDDING_CONFIG.wishesDbUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newWish),
        });
      } else {
        // Online: PUT full updated wishes array (kvdb.io key-value store)
        await fetch(WEDDING_CONFIG.wishesDbUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(wishesArray),
        });
      }
    } catch (err) {
      console.warn("Could not save wish to database:", err);
    }
  }

  // Render wishes array onto the Wishes Wall
  function renderWishes(wishes) {
    wishesList.innerHTML = "";
    wishesLoader.classList.add("hidden");

    // Sort wishes: Newest first
    const sortedWishes = [...wishes].sort((a, b) => b.timestamp - a.timestamp);

    if (sortedWishes.length === 0) {
      wishesList.innerHTML = `<p class="no-wishes">No blessings yet. Be the first to leave one!</p>`;
      return;
    }

    sortedWishes.forEach((item) => {
      const wishItem = document.createElement("div");
      wishItem.className = "wish-item";

      // Map Attendance Value to readable format
      let attendText = "Attending";
      if (item.attendance === "yes-dance") attendText = "Ready to Dance! 💃";
      else if (item.attendance === "yes-food")
        attendText = "Joining the Feast! 🥂";
      else if (item.attendance === "maybe") attendText = "Hoping to Join 🤞";
      else if (item.attendance === "no") attendText = "Sending Love ❤️";

      wishItem.innerHTML = `
        <div class="wish-header">
          <span class="wish-name">${sanitizeHTML(item.name)}</span>
          <span class="wish-attend">${attendText}</span>
        </div>
        <p class="wish-msg">"${sanitizeHTML(item.wishes || "Sending all our love and blessings!")}"</p>
      `;
      wishesList.appendChild(wishItem);
    });
  }

  // Load and render initial guestbook wall
  let currentWishes = await fetchWishes();
  renderWishes(currentWishes);

  // Form submission handler
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("guestName").value.trim();
    const phone = document.getElementById("guestPhone").value.trim();
    const attendance = document.getElementById("guestAttendance").value;
    const wishes = document.getElementById("guestWishes").value.trim();

    // Custom Validation for Custom Select Dropdown
    if (!attendance) {
      alert("Please select your attendance status! ✦");
      return;
    }

    if (!name) return;

    // Create new wish object (exclude phone from wishes wall list for privacy)
    const newWish = {
      name: name,
      phone: phone,
      attendance: attendance,
      wishes: wishes,
      timestamp: Date.now(),
    };

    // Prepend to current list
    currentWishes.unshift(newWish);

    // Render immediately in UI for responsive feedback
    renderWishes(currentWishes);

    // Save to local JSON database file
    saveWish(newWish, currentWishes);

    // Persist submission state in client browser
    localStorage.setItem("my_rsvp_submitted", "true");

    // Show Success Screen
    formContainer.classList.add("hidden");
    successScreen.classList.remove("hidden");

    // Trigger celebration effects (Confetti burst)
    if (window.weddingEffects) {
      window.weddingEffects.triggerConfettiBurst();
      // Drop a couple of extra fireworks!
      setTimeout(() => window.weddingEffects.launchFirework(), 500);
    }
  });
}

// 6. VIEWPORT SNAPPING & SECTION OBSERVERS (Fireworks Trigger)
function initSectionObservers() {
  const sections = document.querySelectorAll("section");
  const appContainer = document.getElementById("appContainer");

  const observerOptions = {
    root: appContainer,
    threshold: 0.55, // Trigger when section is 55% visible
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active-snap");

        // Custom animation triggers depending on section
        const sectionId = entry.target.id;

        // Trigger fireworks randomly on Countdown page or Events page
        if (sectionId === "countdown-page" || sectionId === "events-page") {
          if (window.weddingEffects) {
            window.weddingEffects.launchFirework();
            // Launch another firework after a small delay
            setTimeout(() => {
              if (entry.target.classList.contains("active-snap")) {
                window.weddingEffects.launchFirework();
              }
            }, 1500);
          }
        }
      } else {
        entry.target.classList.remove("active-snap");
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

  // Handle manual target scrolling buttons
  const scrollTriggers = document.querySelectorAll(".next-section-trigger");
  scrollTriggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// 7. UTILITY CONTROLS (Music toggle, Share invite, Calendar add)
function initUtilityControls() {
  const btnMusic = document.getElementById("btn-music-toggle");
  const bgMusic = document.getElementById("bg-music");
  const btnShare = document.getElementById("btn-share");
  const btnCalendar = document.getElementById("btn-add-calendar");

  // Music Toggle
  btnMusic.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      btnMusic.className = "music-btn-spinning";
    } else {
      bgMusic.pause();
      btnMusic.className = "music-btn-paused";
    }
  });

  // Web Share Link
  btnShare.addEventListener("click", async () => {
    const shareData = {
      title: `Wedding Invitation: ${WEDDING_CONFIG.groomName} & ${WEDDING_CONFIG.brideName}`,
      text: `You are cordially invited to the wedding celebration of ${WEDDING_CONFIG.groomName} and ${WEDDING_CONFIG.brideName}. Explore the invitation:`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert(
          "Invitation link copied to clipboard! Share it with your loved ones. ✦",
        );
      }
    } catch (err) {
      console.log("Error sharing:", err);
    }
  });

  // Calendar .ics download file compilation
  btnCalendar.addEventListener("click", () => {
    const title = `Wedding Ceremony: ${WEDDING_CONFIG.groomName} & ${WEDDING_CONFIG.brideName}`;
    const desc = `Join us to celebrate the wedding ceremony of ${WEDDING_CONFIG.groomName} and ${WEDDING_CONFIG.brideName}.`;
    const loc = `${WEDDING_CONFIG.venueName}, ${WEDDING_CONFIG.venueAddress}`;

    // ICS formatted date stamps (YYYYMMDDTHHmmSSZ)
    // 2026-12-18T19:00:00 -> 20261218T190000 (Local time)
    const startDate = "20260830T063000";
    const endDate = "20260830T090000";

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Luxury Wedding Invitation//EN
BEGIN:VEVENT
UID:${Date.now()}@weddinginvite.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${title}
DESCRIPTION:${desc}
LOCATION:${loc}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${WEDDING_CONFIG.groomName}_${WEDDING_CONFIG.brideName}_Wedding.ics`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// 8. SECURITY SANITIZATION HELPER
function sanitizeHTML(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// 9. CUSTOM SELECT DROPDOWN LOGIC
function initCustomSelect() {
  const selectContainer = document.getElementById("attendanceSelect");
  if (!selectContainer) return;

  const trigger = selectContainer.querySelector(".custom-select-trigger");
  const label = document.getElementById("custom-select-label");
  const options = selectContainer.querySelectorAll(".custom-option");
  const hiddenInput = document.getElementById("guestAttendance");

  // Toggle dropdown when trigger is clicked
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    selectContainer.classList.toggle("active");
  });

  // Handle option selection
  options.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const value = option.getAttribute("data-value");
      const text = option.innerText;

      // Set hidden input value
      hiddenInput.value = value;

      // Update label text and trigger visual change event
      label.innerText = text;
      label.style.color = "var(--color-gold-solid)";

      // Remove selected class from all options, add to clicked
      options.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");

      // Close dropdown
      selectContainer.classList.remove("active");

      // Dispatch change event on the hidden input to trigger validation checks
      hiddenInput.dispatchEvent(new Event("change"));
    });
  });

  // Close dropdown if clicked outside the select container
  window.addEventListener("click", () => {
    selectContainer.classList.remove("active");
  });
}
