# 🎊 Wedding RSVP System

A wedding attendance confirmation management system with automatic Excel export functionality.

## ✨ Features

- 📝 Online attendance confirmation form
- 👥 Guest list management
- 📊 Attendance statistics
- 📋 Excel file export for guest list
- 📱 Responsive design for mobile and desktop
- 🔄 Real-time data auto-refresh

## 🚀 Installation and Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 3. Access the application
- **Main page (RSVP Form)**: http://localhost:3000
- **Admin page**: http://localhost:3000/admin.html
- **Download Excel**: http://localhost:3000/download-excel

## 📂 Project Structure

```
.
├── server.js              # Main Node.js server
├── package.json           # Dependencies and scripts
├── rsvp_data.json        # Data storage file (auto-generated)
├── thanhanwedding/
│   ├── index.html        # Main RSVP form page
│   ├── form-handler.js   # JavaScript form handler
│   └── admin.html        # Admin page
└── README.md             # This guide
```

## 🎯 How to Use

### For guests:
1. Access the main page: http://localhost:3000
2. Fill in name, message and select attendance confirmation
3. Click "SEND MESSAGE AND CONFIRM"
4. Receive confirmation notification

### For administrators:
1. Access admin page: http://localhost:3000/admin.html
2. View general statistics
3. View detailed guest list
4. Download Excel file using "📊 Download Excel" button
5. Delete unwanted entries

## 📊 Excel Export

The Excel file will contain columns:
- **No.**: Serial number
- **Guest Name**: Sender's name
- **Attendance Confirmation**: Guest's choice
- **Message**: Message from guest
- **Submission Time**: Timestamp

And statistics section at the bottom with:
- Total responses
- Number of people attending
- Number of people not attending
- Number of people unsure

## 🔧 API Endpoints

### POST /submit-rsvp
Submit attendance confirmation form
```json
{
  "name": "Guest Name",
  "message": "Message",
  "form_item4": "I will definitely attend"
}
```

### GET /api/rsvp-data
Get list and statistics

### GET /download-excel
Download Excel file

### DELETE /api/rsvp-data/:id
Delete a data entry

## 🎨 Customization

### Change form interface:
- Edit CSS in `thanhanwedding/index.html` file
- Modify layout in elements with `ladi-*` class

### Change admin interface:
- Edit CSS in `thanhanwedding/admin.html`
- Customize colors and layout as desired

### Add data fields:
1. Add input in HTML form
2. Update JavaScript handler in `form-handler.js`
3. Modify server.js to handle new field
4. Update Excel export to include new field

## 🔒 Security

- Input validation on both client and server
- CORS protection
- Rate limiting can be added if needed
- Admin page has no authentication (can be added)

## 📝 Notes

- Data is stored in `rsvp_data.json` file
- Server automatically backs up data
- Form has basic validation
- Responsive design for all devices

## 🛠 Troubleshooting

### "Cannot find module" error:
```bash
npm install
```

### Port 3000 already in use:
Change PORT in `.env` file or:
```bash
PORT=3001 npm start
```

### Data not displaying:
- Check if `rsvp_data.json` file exists
- Restart server
- Check browser console for debugging

## 📞 Support

If you encounter any issues, please:
1. Check console logs
2. View `rsvp_data.json` file
3. Restart server
4. Delete JSON file to reset data if needed 