const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const detectBtn = document.getElementById('detect-btn');
const loader = document.getElementById('loader');
const resultSection = document.getElementById('result-section');
const resultImage = document.getElementById('result-image');
const detectionDetails = document.getElementById('detection-details');

let currentFile = null;

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        currentFile = files[0];
        
        // Check if file is an image
        if (!currentFile.type.startsWith('image/')) {
            alert('الرجاء رفع صورة فقط.');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.readAsDataURL(currentFile);
        reader.onloadend = function() {
            imagePreview.src = reader.result;
            previewContainer.style.display = 'block';
            detectBtn.disabled = false;
            
            // Hide result section if it was open
            resultSection.style.display = 'none';
        }
    }
}

// Handle Detect Button Click
detectBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    // Show loader and disable button
    detectBtn.style.display = 'none';
    loader.style.display = 'block';

    const formData = new FormData();
    formData.append('image', currentFile);

    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ أثناء معالجة الصورة');
        }

        // Show results
        displayResults(data);

    } catch (error) {
        alert('خطأ: ' + error.message);
    } finally {
        // Reset UI
        loader.style.display = 'none';
        detectBtn.style.display = 'block';
    }
});

function displayResults(data) {
    if (data.output_image) {
        // Add timestamp to prevent caching
        resultImage.src = data.output_image + '?t=' + new Date().getTime();
    }

    let detailsHTML = '<h3>تفاصيل الأضرار:</h3>';
    
    if (data.detections && data.detections.length > 0) {
        detailsHTML += '<ul>';
        data.detections.forEach((det, index) => {
            const confidence = (det.confidence * 100).toFixed(2);
            detailsHTML += `<li>ضرر #${index + 1}: <strong>${det.class}</strong> (نسبة الثقة: ${confidence}%)</li>`;
        });
        detailsHTML += '</ul>';
    } else {
        detailsHTML += '<p>لم يتم اكتشاف أي أضرار في هذه الصورة.</p>';
    }

    detectionDetails.innerHTML = detailsHTML;
    resultSection.style.display = 'block';
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth' });
}
