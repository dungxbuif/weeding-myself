function doPost(e) {
   try {
      // Get the active spreadsheet (make sure you're running this from a sheet-bound script)
      var sheet = SpreadsheetApp.getActiveSheet();

      // Parse the incoming data
      var data = JSON.parse(e.postData.contents);

      // Create timestamp
      var timestamp = new Date();

      // Format timestamp for Vietnam timezone
      var formattedTime = Utilities.formatDate(
         timestamp,
         'Asia/Ho_Chi_Minh',
         'dd/MM/yyyy HH:mm:ss'
      );

      // Append data to sheet - matching Vietnamese headers
      // Headers: 'Tên người tham dự | Lời chúc | Xác nhận tham dự | Thời gian gửi'
      sheet.appendRow([
         data.name || '',
         data.message || '',
         data.form_item4 || '',
         formattedTime,
      ]);

      // Return success response
      return ContentService.createTextOutput(
         JSON.stringify({
            success: true,
            message: 'Data saved successfully',
         })
      ).setMimeType(ContentService.MimeType.JSON);
   } catch (error) {
      // Return error response
      return ContentService.createTextOutput(
         JSON.stringify({
            success: false,
            message: 'Error: ' + error.toString(),
         })
      ).setMimeType(ContentService.MimeType.JSON);
   }
}

function doGet(e) {
   // Optional: Handle GET requests for testing
   return ContentService.createTextOutput(
      JSON.stringify({
         message: 'Wedding RSVP Google Apps Script is running',
      })
   ).setMimeType(ContentService.MimeType.JSON);
}
