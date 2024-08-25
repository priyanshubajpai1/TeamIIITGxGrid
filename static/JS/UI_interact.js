
let currentItemIndex = 0;
let allItems = [];

function previewItems() {
    var previewBox = document.createElement("div");
    previewBox.id = "previewBox";
    previewBox.style.position = "fixed";
    previewBox.style.top = "50%";
    previewBox.style.left = "50%";
    previewBox.style.transform = "translate(-50%, -50%)";
    previewBox.style.width = "80%";
    previewBox.style.height = "80%";
    previewBox.style.backgroundColor = "white";
    previewBox.style.zIndex = "1000";
    previewBox.style.borderRadius = "10px";
    previewBox.style.padding = "20px";
    previewBox.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.1)";
    previewBox.style.overflowY = "auto";

    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search items...";
    searchInput.style.width = "100%";
    searchInput.style.padding = "10px";
    searchInput.style.marginBottom = "20px";
    searchInput.style.borderRadius = "5px";
    searchInput.style.border = "1px solid #ddd";
    searchInput.addEventListener("input", filterItems);
    previewBox.appendChild(searchInput);

    var itemContainer = document.createElement("div");
    itemContainer.id = "itemContainer";
    previewBox.appendChild(itemContainer);

    var navigation = document.createElement("div");
    navigation.style.display = "flex";
    navigation.style.justifyContent = "space-between";
    navigation.style.alignItems = "center";
    navigation.style.marginTop = "20px";

    var prevButton = document.createElement("button");
    prevButton.innerHTML = "Previous";
    prevButton.onclick = showPreviousItem;
    navigation.appendChild(prevButton);

    var closeButton = document.createElement("button");
    closeButton.innerHTML = "Close";
    closeButton.onclick = closePreview;
    closeButton.style.padding = "10px 20px";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "5px";
    closeButton.style.backgroundColor = "red";
    closeButton.style.color = "white";
    closeButton.style.cursor = "pointer";
    navigation.appendChild(closeButton);

    var nextButton = document.createElement("button");
    nextButton.innerHTML = "Next";
    nextButton.onclick = showNextItem;
    navigation.appendChild(nextButton);

    previewBox.appendChild(navigation);

    document.body.appendChild(previewBox);

    var loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Loading items...";
    itemContainer.appendChild(loadingMessage);

    // Make an API call to the server
    fetch('/showitems', {
        method: 'GET',
    })
        .then(response => response.json())
        .then(data => {
            allItems = data;
            itemContainer.removeChild(loadingMessage);
            showItem(currentItemIndex);
        })
        .catch(error => {
            console.error('Error:', error);
            itemContainer.removeChild(loadingMessage);
            var errorMessage = document.createElement("p");
            errorMessage.textContent = "An error occurred while fetching items.";
            errorMessage.style.color = "red";
            itemContainer.appendChild(errorMessage);
        });
}

function showItem(index) {
    var itemContainer = document.getElementById("itemContainer");
    itemContainer.innerHTML = '';

    if (allItems.length === 0) {
        itemContainer.innerHTML = '<p>No items found matching your search.</p>';
        return;
    }

    if (index < 0 || index >= allItems.length) {
        return;
    }

    var item = allItems[index];
    var itemDiv = createItemDiv(item);
    itemContainer.appendChild(itemDiv);
}

function createItemDiv(item) {
    var itemDiv = document.createElement("div");
    itemDiv.className = "item-preview";
    itemDiv.style.marginBottom = "30px";
    itemDiv.style.padding = "20px";
    itemDiv.style.border = "1px solid #ddd";
    itemDiv.style.borderRadius = "8px";
    itemDiv.style.display = "flex";
    itemDiv.style.backgroundColor = "#fff";

    var imageContainer = document.createElement("div");
    imageContainer.style.width = "300px";
    imageContainer.style.marginRight = "20px";

    if (item.image) {
        try {
            var imageUrls = JSON.parse(item.image);
            if (imageUrls.length > 0) {
                var mainImageContainer = document.createElement("div");
                mainImageContainer.style.width = "300px";
                mainImageContainer.style.height = "300px";
                mainImageContainer.style.display = "flex";
                mainImageContainer.style.justifyContent = "center";
                mainImageContainer.style.alignItems = "center";
                mainImageContainer.style.marginBottom = "10px";
                mainImageContainer.style.border = "1px solid #ddd";

                var mainImage = document.createElement("img");
                mainImage.src = "/image/"+imageUrls[0];
                mainImage.style.maxWidth = "100%";
                mainImage.style.maxHeight = "100%";
                mainImage.style.objectFit = "contain";

                mainImageContainer.appendChild(mainImage);
                imageContainer.appendChild(mainImageContainer);

                var thumbnailContainer = document.createElement("div");
                thumbnailContainer.style.display = "flex";
                thumbnailContainer.style.justifyContent = "start";
                thumbnailContainer.style.flexWrap = "wrap";

                imageUrls.slice(0, 5).forEach((url, index) => {
                    var thumbnail = document.createElement("img");
                    thumbnail.src = "/image/"+url;
                    thumbnail.style.width = "50px";
                    thumbnail.style.height = "50px";
                    thumbnail.style.objectFit = "cover";
                    thumbnail.style.margin = "5px";
                    thumbnail.style.border = "1px solid #ddd";
                    thumbnail.style.cursor = "pointer";

                    thumbnail.addEventListener("click", function () {
                        mainImage.src = "/image/"+url;
                    });

                    thumbnailContainer.appendChild(thumbnail);
                });

                imageContainer.appendChild(thumbnailContainer);
            }
        } catch (e) {
            console.error("Error parsing image JSON:", e);
        }
    }

    itemDiv.appendChild(imageContainer);

    var infoContainer = document.createElement("div");
    infoContainer.style.flex = "1";

    var name = document.createElement("h2");
    name.textContent = item.product_name;
    name.style.fontSize = "24px";
    name.style.marginBottom = "10px";
    name.style.color = "#0066c0";
    infoContainer.appendChild(name);

    var brand = document.createElement("p");
    brand.textContent = `by ${item.brand}`;
    brand.style.fontSize = "14px";
    brand.style.color = "#555";
    brand.style.marginBottom = "10px";
    infoContainer.appendChild(brand);

    var rating = document.createElement("div");
    //take substring of product rating and convert it to number, substring is first 3 characters
    item.product_rating=Number(item.product_rating.substring(0,3));
    rating.textContent = `★`.repeat(Math.round(item.product_rating)) + `☆`.repeat(5 - Math.round(item.product_rating));
    rating.style.color = "#FFA41C";
    rating.style.fontSize = "18px";
    rating.style.marginBottom = "10px";
    infoContainer.appendChild(rating);

    var price = document.createElement("p");
    price.textContent = `₹${item.discounted_price}`;
    price.style.fontSize = "28px";
    price.style.fontWeight = "bold";
    price.style.color = "#B12704";
    price.style.marginBottom = "15px";
    infoContainer.appendChild(price);

    var description = document.createElement("p");
    description.textContent = item.description;
    description.style.fontSize = "14px";
    description.style.lineHeight = "1.5";
    description.style.color = "#333";
    description.style.overflow = "hidden";
    description.style.display = "-webkit-box";
    description.style.webkitLineClamp = "5";
    description.style.webkitBoxOrient = "vertical";
    infoContainer.appendChild(description);

    itemDiv.appendChild(infoContainer);

    return itemDiv;
}

function showPreviousItem() {
    if (currentItemIndex > 0) {
        currentItemIndex--;
        showItem(currentItemIndex);
    }
}

function showNextItem() {
    if (currentItemIndex < allItems.length - 1) {
        currentItemIndex++;
        showItem(currentItemIndex);
    }
}

function filterItems() {
    var searchQuery = document.querySelector("#previewBox input[type='text']").value.toLowerCase();
    var filteredItems = allItems.filter(item =>
        item.product_name.toLowerCase().includes(searchQuery) ||
        item.brand.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery)
    );

    currentItemIndex = 0;
    if (filteredItems.length > 0) {
        allItems = filteredItems; // Update allItems with filtered results
        showItem(currentItemIndex);
    } else {
        var itemContainer = document.getElementById("itemContainer");
        itemContainer.innerHTML = '<p>No items found matching your search.</p>';
    }
}

function closePreview() {
    document.getElementById("previewBox").remove();
    currentItemIndex = 0;
    allItems = [];
}

let isGeneratingResponse = false;

function sendMessage() {
    if (isGeneratingResponse) {
        console.log("A response is still being generated. Please wait.");
        return;
    }

    var userInput = $('#user-input').val();
    $('#chat-container').append('<div class="message user-message animate__animated animate__fadeInUp">' + marked.parse(userInput) + '</div>');
    $('#user-input').val('');
    let blocker=false;
    // search if "search for" substring is present in the user input
    if(userInput.toLowerCase().includes("search for"))
        blocker=true;
    console.log(blocker);

    // Convert user input to speech (strip markdown here too)
    convertToSpeechwithText(" ");

    isGeneratingResponse = true;

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput })
    }).then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let helperResponse = '';
        let currentSentence = '';

        function readStream() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    isGeneratingResponse = false;
                    if (currentSentence.trim() !== '') {
                        appendToSpeechwithText(' ');
                    }
                    return;
                }
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                lines.forEach(line => {
                    if (line.startsWith('data: ')) {
                        const word = line.slice(6);
                        if (word === 'START') {
                            $('#chat-container').append('<div class="message helper-message animate__animated animate__fadeInUp"></div>');
                        } else if (word === 'END') {
                            // Do nothing
                        } else {
                            helperResponse += word.replace(/\\n/g, '\n');
                            $('.helper-message:last').html(marked.parse(helperResponse));
                            
                            currentSentence += word;
                            if (!blocker && (word.match(/[.!?]\s*$/) || word.match(/[\+\*]|\\[nr]/g))) {
                                vocalizedText=stripMarkdown(currentSentence)
                                appendToSpeechwithText(vocalizedText);
                                currentSentence = '';
                            }
                            else{
                                if(currentSentence.toLowerCase().includes("-----")){
                                    blocker=false;
                                    console.log("blocker is false")
                                    currentSentence = '';
                                }
                            }
                        }
                        $('#chat-container').scrollTop($('#chat-container')[0].scrollHeight);
                    }
                });
                readStream();
            });
        }
        readStream();
    }).catch(error => {
        console.error('Error:', error);
        isGeneratingResponse = false;
    });
}

// Function to strip markdown
function stripMarkdown(text) {
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Remove bold/italic
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');
    
    // Remove links
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove images
    text = text.replace(/!\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove headers
    text = text.replace(/^#+\s+/gm, '');
    
    // Remove blockquotes
    text = text.replace(/^>\s+/gm, '');
    
    // Remove horizontal rules
    text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '');
    
    // Remove unordered list markers
    text = text.replace(/^[-*+]\s+/gm, '');
    
    // Remove ordered list markers
    text = text.replace(/^\d+\.\s+/gm, '');
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    // Replace newlines and related elements with spaces
    text = text.replace(/\r\n|\n|\r/g, ' ');
    
    // Replace multiple spaces with a single space
    text = text.replace(/\s+/g, ' ');

    // Remove +, *, \n, \r, and 🤔, even when they're adjacent to other characters
    text = text.replace(/[\+\*]|\\[nr]|🤔/g, '');

    return text.trim();
}
window.sendMessage = sendMessage;

function clearContext() {
    $.post('/clear_context', function (data) {
        $('#chat-container').append('<div class="message system-message animate__animated animate__fadeIn">' + marked.parse(data.message) + '</div>');
        $('#chat-container').scrollTop($('#chat-container')[0].scrollHeight);
    });
}

$('#user-input').keypress(function (e) {
    if (e.which == 13) {
        sendMessage();
        return false;
    }
});

// New script for the overlay
$(document).ready(function () {
    $('#continue-btn').click(function () {
        $('#overlay').css('opacity', '0');
        setTimeout(function () {
            $('#overlay').css('display', 'none');
        }, 500);
    });
});

