/*
 * Vosme International Sdn Bhd - Global Frontend Controller
 * General UI Animations, Interactive Card Glows & Form Validations
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. HEADER SCROLL STATE
  const header = document.querySelector('header');
  const scrollThreshold = 50;

  const handleHeaderScroll = () => {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  
  window.addEventListener('scroll', handleHeaderScroll);
  handleHeaderScroll(); // initial load execution


  // 2. MOBILE NAVIGATION HAMBURGER DRAWER
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isActive = mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = isActive ? 'hidden' : 'auto';
    });

    // Close menu when clicking on page links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    });
  }


  // 3. GLASSMOPHISM CARDS MOUSE GLOW OVERLAY
  // Dynamic CSS variables mapper tracking local coordinates inside cards
  const glassCards = document.querySelectorAll('.glass-card');
  glassCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });


  // 4. SCROLL REVEAL (INTERSECTION OBSERVER)
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // trigger animation once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // 5. ACCORDION FAQ CONTROLLER
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Collapse all other items
        faqItems.forEach(i => i.classList.remove('active'));
        
        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });


  // 6. CONTACT FORM VALIDATOR
  const contactForm = document.getElementById('vosme-contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('inquiry-name').value.trim();
      const email = document.getElementById('inquiry-email').value.trim();
      const subject = document.getElementById('inquiry-subject').value.trim();
      const message = document.getElementById('inquiry-message').value.trim();
      
      // Simple validation regex checks
      if (!name || !email || !subject || !message) {
        showFeedback('请填写所有必填字段！(Please fill out all required fields.)', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFeedback('请输入有效的电子邮箱地址！(Please enter a valid email address.)', 'error');
        return;
      }

      // Simulate API submit trigger
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '发送中... (Sending...)';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        showFeedback('您的咨询已成功发送！我们将尽快与您联系。(Your inquiry has been successfully sent! We will contact you shortly.)', 'success');
        contactForm.reset();
      }, 1500);
    });

    const showFeedback = (msg, type) => {
      formFeedback.textContent = msg;
      formFeedback.className = 'form-feedback ' + type;
      
      // Scroll feedback into viewport
      formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  // 7. GOOGLE CALENDAR APPOINTMENT SYSTEM (Sales Funnel Connector)
  const bookingForm = document.getElementById('vosme-booking-form');
  const dateInput = document.getElementById('booking-date');
  const timeSlotsContainer = document.getElementById('time-slots-grid');
  const statusOverlay = document.getElementById('booking-status-overlay');
  const overlayText = document.getElementById('booking-status-text');
  const overlayBtn = document.getElementById('btn-close-overlay');
  
  if (bookingForm && dateInput) {
    // A. Disable past dates (Force tomorrow onwards)
    const tomorrow = new Date(Date.now() + 86400000);
    const minDateString = tomorrow.toISOString().split('T')[0];
    dateInput.min = minDateString;
    dateInput.value = minDateString; // set default tomorrow

    let selectedTimeSlot = null;

    // B. Handle time slot selections
    if (timeSlotsContainer) {
      const slotButtons = timeSlotsContainer.querySelectorAll('.time-slot-btn');
      slotButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          slotButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedTimeSlot = btn.getAttribute('data-slot');
        });
      });
    }

    // C. Form Submit Handler
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('booking-name').value.trim();
      const email = document.getElementById('booking-email').value.trim();
      const company = document.getElementById('booking-company').value.trim();
      const service = document.getElementById('booking-service').value;
      const date = dateInput.value;
      const goals = document.getElementById('booking-goals').value.trim();

      // Basic Validation
      if (!name || !email || !date) {
        alert('请填写姓名、电子邮箱及选择日期！(Please enter Name, Email, and select a Date.)');
        return;
      }

      if (!selectedTimeSlot) {
        alert('请选择具体的咨询时间段！(Please select a dynamic Time Slot.)');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('请输入有效的电子邮箱地址！(Please enter a valid email address.)');
        return;
      }

      // Display Loader Overlay
      statusOverlay.classList.add('active');
      overlayText.innerHTML = `
        <h4 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; color: hsl(var(--color-cyan));">
          同步中... (Synchronizing...)
        </h4>
        <p style="color: hsl(var(--text-muted)); font-weight: 300;">
          正在安全地将您的预约写入谷歌日历并发送会议邀请...<br>
          (Writing appointment to Google Calendar & sending invite...)
        </p>
      `;
      overlayBtn.style.display = 'none';

      // Deployment Apps Script URL - Swappable URL Placeholder
      const appsScriptUrl = 'https://script.google.com/macros/s/GSC_APPS_SCRIPT_URL_PLACEHOLDER/exec';

      const payload = {
        name: name,
        email: email,
        company: company,
        service: service,
        date: date,
        time: selectedTimeSlot,
        goals: goals
      };

      // Check if URL is placeholder; if so, simulate direct success for local dev preview
      if (appsScriptUrl.includes('GSC_APPS_SCRIPT_URL_PLACEHOLDER')) {
        setTimeout(() => {
          overlayText.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
            <h4 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; color: #10b981;">
              预约成功！(Booking Successful!)
            </h4>
            <p style="color: hsl(var(--text-muted)); font-weight: 300; font-size: 0.95rem; margin-bottom: 1.5rem;">
              <strong>[本地开发预览模拟]</strong> 已成功同步数据包！<br>
              <strong>时间：</strong>${date} 在 ${selectedTimeSlot} (UTC+8)<br>
              <strong>项目：</strong>${service}<br><br>
              在生产环境部署时，只需将部署好的 Google Apps Script 网址粘贴到 <code>assets/js/main.js</code> 中即可实现 100% 自动谷歌日历同步写入！
            </p>
          `;
          overlayBtn.style.display = 'inline-block';
          bookingForm.reset();
          if (timeSlotsContainer) {
            timeSlotsContainer.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
          }
          selectedTimeSlot = null;
        }, 2000);
      } else {
        // Send real fetch API POST request
        fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain' // Apps Script doPost often prefers text/plain to bypass complex CORS preflights
          },
          body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            overlayText.innerHTML = `
              <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
              <h4 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; color: #10b981;">
                预约确认！(Booking Confirmed!)
              </h4>
              <p style="color: hsl(var(--text-muted)); font-weight: 300;">
                日程已成功写入 Google Calendar！<br>
                我们已向 <strong>${email}</strong> 发送了日历日程会议邀请邮件，请注意查收并确认日程。<br>
                期待与您的深入合作！
              </p>
            `;
          } else {
            throw new Error(data.message || 'Apps Script returned failure.');
          }
        })
        .catch(err => {
          overlayText.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h4 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; color: #ef4444;">
              同步失败 (Synchronization Failed)
            </h4>
            <p style="color: hsl(var(--text-muted)); font-weight: 300;">
              预约写入谷歌日历时遇到错误：<br>
              <code>${err.message}</code><br><br>
              请检查您的网络连接或确保您的 Apps Script API 正常运作。
            </p>
          `;
        })
        .finally(() => {
          overlayBtn.style.display = 'inline-block';
        });
      }
    });

    // D. Close Status Overlay Handler
    if (overlayBtn) {
      overlayBtn.addEventListener('click', () => {
        statusOverlay.classList.remove('active');
      });
    }
  }

  // 8. INTERACTIVE CAPABILITY TABS & FUNNEL SYNC (Our Professional Hub)
  const tabButtons = document.querySelectorAll('.capability-tab-btn');
  const panels = document.querySelectorAll('.capability-panel');
  const bookingServiceSelect = document.getElementById('booking-service');
  const bookingContainer = document.querySelector('.hub-booking');

  if (tabButtons.length > 0 && panels.length > 0 && bookingServiceSelect) {
    // Tab Button Click Listener
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedServiceId = btn.getAttribute('data-service');

        // Toggle Tab Active Classes
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle Detail Panel Fade Transitions
        panels.forEach(panel => {
          panel.classList.remove('active');
        });
        const targetPanel = document.getElementById(`panel-${selectedServiceId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        // Auto-select corresponding option in the scheduling form dropdown
        // Service Maps:
        // - ai   -> AI Consulting & Cognitive Mapping
        // - auto -> Cognitive Automations & Workflow Integration
        // - web  -> Bespoke Web Design & WebGL Experiences
        // - apps -> Custom Software & Mobile App Engineering
        let targetServiceVal = '';
        if (selectedServiceId === 'ai') {
          targetServiceVal = 'AI Consulting & Cognitive Mapping';
        } else if (selectedServiceId === 'auto') {
          targetServiceVal = 'Cognitive Automations & Workflow Integration';
        } else if (selectedServiceId === 'web') {
          targetServiceVal = 'Bespoke Web Design & WebGL Experiences';
        } else if (selectedServiceId === 'apps') {
          targetServiceVal = 'Custom Software & Mobile App Engineering';
        }

        if (targetServiceVal) {
          bookingServiceSelect.value = targetServiceVal;
          // Trigger artificial change event just in case other logic relies on it
          bookingServiceSelect.dispatchEvent(new Event('change'));
        }
      });
    });

    // Handle "Book Strategy Session" Trigger buttons inside capability panels
    const hubBookTriggers = document.querySelectorAll('.hub-book-trigger');
    hubBookTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const targetServiceVal = trigger.getAttribute('data-target-service');
        if (targetServiceVal) {
          bookingServiceSelect.value = targetServiceVal;
          bookingServiceSelect.dispatchEvent(new Event('change'));
        }

        // Scroll smoothly to booking form
        if (bookingContainer) {
          bookingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Temporary Pulse Highlight styling
          bookingContainer.classList.add('highlight-pulse');
          setTimeout(() => {
            bookingContainer.classList.remove('highlight-pulse');
          }, 3000);
        }
      });
    });
  }
});

