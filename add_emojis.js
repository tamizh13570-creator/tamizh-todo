const fs = require('fs');
let html = fs.readFileSync('d:/TODO/index.html', 'utf8');

// Priority Dropdowns
html = html.replace(/<option value="medium">\s*Medium<\/option>/g, '<option value="medium">&#x1F7E1; Medium</option>');
html = html.replace(/<option value="high">\s*High<\/option>/g, '<option value="high">&#x1F534; High</option>');
html = html.replace(/<option value="low">\s*Low<\/option>/g, '<option value="low">&#x1F7E2; Low</option>');

// Tabs
html = html.replace(/>\s*Daily<\/button>/g, '>&#x1F4CB; Daily</button>');
html = html.replace(/>\s*Monthly<\/button>/g, '>&#x1F4C5; Monthly</button>');
html = html.replace(/>\s*Yearly<\/button>/g, '>&#x1F5D3; Yearly</button>');
html = html.replace(/>\s*Samples<\/button>/g, '>&#x1F4CC; Samples</button>');
html = html.replace(/>\s*Graph<\/button>/g, '>&#x1F4CA; Graph</button>');
html = html.replace(/>\s*All Data<\/button>/g, '>&#x1F5C2; All Data</button>');
html = html.replace(/>\s*Year View<\/button>/g, '>&#x1F30D; Year View</button>');

// Period Titles and countdowns
html = html.replace(/<span class="countdown-label">\s*Daily tasks auto-delete at midnight<\/span>/g, '<span class="countdown-label">&#x23F3; Daily tasks auto-delete at midnight</span>');
html = html.replace(/<div class="period-title">\s*Monthly Goals<\/div>/g, '<div class="period-title">&#x1F4C5; Monthly Goals</div>');
html = html.replace(/<div class="period-title">\s*Yearly Aspirations<\/div>/g, '<div class="period-title">&#x1F5D3; Yearly Aspirations</div>');
html = html.replace(/<div class="period-title">\s*Sample Templates<\/div>/g, '<div class="period-title">&#x1F4CC; Sample Templates</div>');

// Other common headers (using raw matches where tags might not match strictly)
html = html.replace(/>\s*Weekly Completion<\/div>/g, '>&#x1F4CA; Weekly Completion</div>');
html = html.replace(/>\s*Priority Breakdown<\/div>/g, '>&#x1F3AF; Priority Breakdown</div>');
html = html.replace(/>\s*Reset Samples\s*<\/button>/g, '>&#x1F504; Reset Samples</button>');
html = html.replace(/>\s*Add Daily Task\s*<\/label>/g, '>&#x1F4DD; Add Daily Task</label>');
html = html.replace(/>\s*Reminder:\s*<\/span>/g, '>&#x1F514; Reminder:</span>');

// Save back
fs.writeFileSync('d:/TODO/index.html', html, 'utf8');
console.log('Emojis added to index.html successfully!');
