
document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault(); 
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    let cameraModel = 'Unknown';
    EXIF.getData(file, function() {
        const make = EXIF.getTag(this, 'Make');
        const model = EXIF.getTag(this, 'Model');
        cameraModel = make ? `${make} ${model || 'Unknown'}` : 'Unknown';
    });

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('https://api.imgbb.com/1/upload?key=0654aad091424f7fae833d9124127e37', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            const imgUrl = data.data.url;
            const imgMetadata = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toLocaleString(),
                width: data.data.width, 
                height: data.data.height 
            };
            const authenticity = checkImageAuthenticity(imgMetadata);
            displayImage(imgUrl, imgMetadata, cameraModel, authenticity);
        } else {
            alert('Image upload failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again later.');
    }
});

function displayImage(imgUrl, metadata, cameraModel, authenticity) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = `
        <div class="image-box">
            <img src="${imgUrl}" alt="Uploaded Image">
            <div class="metadata">
                <h3>Image Metadata:</h3>
                <p><strong>Name:</strong> ${metadata.name || 'N/A'}</p>
                <p><strong>Size:</strong> ${metadata.size || 'N/A'} bytes</p>
                <p><strong>Type:</strong> ${metadata.type || 'N/A'}</p>
                <p><strong>Last Modified:</strong> ${metadata.lastModified || 'N/A'}</p>
                <p><strong>Width:</strong> ${metadata.width || 'N/A'} pixels</p>
                <p><strong>Height:</strong> ${metadata.height || 'N/A'} pixels</p>
                <p><strong>Camera Model:</strong> ${cameraModel}</p> <!-- Display camera model -->
                <h3>Image Authenticity:</h3>
                <p>${authenticity}</p>
            </div>
        </div>
    `;
}

function checkImageAuthenticity(metadata) {
    const fileSizeThreshold = 1000000; 
    const isEdited = metadata.hasOwnProperty('editHistory') || (metadata.size > fileSizeThreshold); 
    const isAIGenerated = metadata.hasOwnProperty('aiGenerated') || metadata.type === 'image/png'; 

    if (!isEdited) {
        return 'This image has been edited.';
    } else if (isAIGenerated) {
        return 'This image has been generated by AI.';
    } else {
        return 'This image is real and unaltered.';
    }
}
