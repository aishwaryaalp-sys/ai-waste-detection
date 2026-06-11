// script.js - UI interactions, webcam/upload, and TensorFlow.js model placeholder
(function(){
  const categories = ['Plastic','Paper','Metal','Glass'];
  let model = null;
  let stream = null;

  document.body.classList.add('js-enabled');

  window.addEventListener('DOMContentLoaded', () => {
    initObservers();
    bindUI();
    tryLoadModel();
  });

  function bindUI(){
    const themeToggle = document.getElementById('themeToggle');
    const webcamButton = document.getElementById('webcamButton');
    const uploadInput = document.getElementById('uploadInput');
    const predictButton = document.getElementById('predictButton');
    const video = document.getElementById('webcamPreview');
    const imagePreview = document.getElementById('imagePreview');

    themeToggle?.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    webcamButton?.addEventListener('click', async () => {
      if (stream) {
        stopWebcam();
        webcamButton.textContent = 'Open Webcam';
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        video.srcObject = stream;
        video.play();
        imagePreview.src = '';
        webcamButton.textContent = 'Close Webcam';
      } catch(err){
        console.error('Webcam error', err);
        alert('Unable to access webcam. Check permissions.');
      }
    });

    uploadInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      imagePreview.src = url;
      const videoEl = document.getElementById('webcamPreview');
      if (videoEl && videoEl.srcObject) { stopWebcam(); document.getElementById('webcamButton').textContent = 'Open Webcam'; }
    });

    document.querySelectorAll('.interactive-card').forEach(card => {
      card.addEventListener('pointerdown', () => card.classList.add('pressed'));
      card.addEventListener('pointerup', () => card.classList.remove('pressed'));
      card.addEventListener('pointerleave', () => card.classList.remove('pressed'));
    });

    predictButton?.addEventListener('click', async () => {
      const statusBox = document.getElementById('statusBox');
      if (statusBox) statusBox.textContent = 'Status: Running prediction...';
      try {
        const useImage = document.getElementById('imagePreview').src;
        let confidence = 0;
        let category = 'Unknown';
        if (model) {
          statusBox && (statusBox.textContent = 'Status: Running model inference...');
          try {
            const imagePreviewEl = document.getElementById('imagePreview');
            const videoEl = document.getElementById('webcamPreview');
            const inputEl = (imagePreviewEl && imagePreviewEl.src) ? imagePreviewEl : videoEl;
            if (!inputEl) throw new Error('No input image or video available for prediction');

            // Preprocess: resize and normalize to 0-1, batch dimension
            let imgTensor = tf.browser.fromPixels(inputEl);
            imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]).toFloat().div(255.0).expandDims(0);

            // Run model (supports LayersModel.predict and GraphModel.executeAsync)
            let output = typeof model.predict === 'function' ? model.predict(imgTensor) : await model.executeAsync(imgTensor);

            // Normalize output to a single tensor and read scores
            const outTensor = Array.isArray(output) ? output[0] : output;
            const scores = await outTensor.data();
            const scoresArr = Array.from(scores);
            const maxIdx = scoresArr.indexOf(Math.max(...scoresArr));
            category = categories[maxIdx] || 'Unknown';
            confidence = Math.round((scoresArr[maxIdx] || 0) * 100);

            // Dispose tensors
            try { if (Array.isArray(output)) output.forEach(t => t.dispose && t.dispose()); else output.dispose && output.dispose(); } catch(e){}
            try { imgTensor.dispose && imgTensor.dispose(); } catch(e){}
          } catch (inferenceErr) {
            console.error('Inference failed, falling back to demo:', inferenceErr);
            statusBox && (statusBox.textContent = 'Status: Inference error — demo fallback');
            // fallback to simulated prediction below
            const idx = Math.floor(Math.random() * categories.length);
            category = categories[idx];
            confidence = Math.round(60 + Math.random() * 40);
          }
        } else {
          // Simulated prediction (random)
          const idx = Math.floor(Math.random() * categories.length);
          category = categories[idx];
          confidence = Math.round(60 + Math.random() * 40);
        }

        // Update UI
        const resultCategoryEl = document.getElementById('resultCategory');
        const resultDetailsEl = document.getElementById('resultDetails');
        const confidenceValueEl = document.getElementById('confidenceValue');
        const fill = document.getElementById('confidenceFill');
        if (resultCategoryEl) resultCategoryEl.textContent = category;
        if (resultDetailsEl) resultDetailsEl.textContent = `Detected as ${category}. Follow local recycling guidelines.`;
        if (confidenceValueEl) confidenceValueEl.textContent = confidence + '%';
        if (fill) fill.style.width = confidence + '%';
        statusBox && (statusBox.textContent = 'Status: Prediction complete');
      } catch (err) {
        console.error(err);
        const statusBoxErr = document.getElementById('statusBox');
        if (statusBoxErr) statusBoxErr.textContent = 'Status: Prediction failed';
      }
    });
  }

  function stopWebcam(){
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    const video = document.getElementById('webcamPreview');
    if (video) { video.srcObject = null; }
  }

  function initObservers(){
    // Reveal animations for cards
    const reveal = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.glass-card, .section-header, .workflow-card, .tech-card, .category-card, .feature-card, .result-card, .developer-card').forEach(el=>reveal.observe(el));

    // Draw SVG paths when in view
    const paths = document.querySelectorAll('.draw-path');
    const pathObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          entry.target.style.animationPlayState = 'running';
          entry.target.style.opacity = 1;
          pathObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    paths.forEach(p=>{
      p.style.opacity = 0;
      p.style.animationPlayState = 'paused';
      pathObserver.observe(p);
    });

    // Animate circles container when in view
    const circlesContainer = document.querySelector('.animated-circles-container');
    if (circlesContainer) {
      const circleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const circles = entry.target.querySelectorAll('.animated-material-circle');
            circles.forEach(circle => {
              circle.style.animationPlayState = 'running';
            });
            circleObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      circleObserver.observe(circlesContainer);
    }
  }

  async function tryLoadModel(){
    const statusBox = document.getElementById('statusBox');
    // Placeholder URL - if you export a Teachable Machine model, place it at ./model/model.json
    const modelURL = './model/model.json';
    statusBox.textContent = 'Status: Looking for model...';
    try {
      // Attempt to load; if model not present this will fail quickly and we gracefully fallback to demo mode
      model = await tf.loadGraphModel(modelURL).catch(()=>null);
      if (!model){
        // Try layers format
        model = await tf.loadLayersModel(modelURL).catch(()=>null);
      }
      if (model){
        statusBox.textContent = 'Status: Model loaded. Ready for inference.';
      } else {
        statusBox.textContent = 'Status: No model found — running demo mode (simulated predictions).';
      }
    } catch(err){
      console.warn('Model load failed', err);
      statusBox.textContent = 'Status: Model load error — demo mode enabled.';
    }
  }

})();
