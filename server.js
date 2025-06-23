const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5500;

const ADMIN_PASSWORD = 'admin123';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
    secret: 'wedding-admin-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // set true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/admin-login');
    }
};

// Admin login page
app.get('/admin-login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login - Wedding RSVP</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .login-container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    width: 100%;
                    max-width: 400px;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .login-header h1 {
                    color: #333;
                    margin-bottom: 10px;
                }
                .login-header p {
                    color: #666;
                    font-size: 14px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: #333;
                    font-weight: bold;
                }
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                }
                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .login-btn {
                    width: 100%;
                    padding: 12px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .login-btn:hover {
                    background: #5a6fd8;
                }
                .error-message {
                    color: #dc3545;
                    text-align: center;
                    margin-top: 15px;
                    padding: 10px;
                    background: #f8d7da;
                    border-radius: 5px;
                    display: ${req.query.error ? 'block' : 'none'};
                }
            </style>
        </head>
        <body>
            <div class="login-container">
                <div class="login-header">
                    <h1>🎊 Admin Login</h1>
                    <p>Nhập mật khẩu để truy cập trang quản trị</p>
                </div>
                
                <form method="POST" action="/admin-login">
                    <div class="form-group">
                        <label for="password">Mật khẩu:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    
                    <button type="submit" class="login-btn">Đăng nhập</button>
                </form>
                
                <div class="error-message">
                    Mật khẩu không đúng! Vui lòng thử lại.
                </div>
            </div>
        </body>
        </html>
    `);
});

// Admin login POST
app.post('/admin-login', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/admin.html');
    } else {
        res.redirect('/admin-login?error=1');
    }
});

// Admin logout
app.get('/admin-logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin-login');
});

// Protect admin.html
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'kientrinhwedding', 'admin.html'));
});

// Protect admin routes
app.get('/api/rsvp-data', requireAuth, (req, res) => {
    res.json({
        data: rsvpData,
        stats: calculateStats()
    });
});

app.delete('/api/rsvp-data/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = rsvpData.findIndex(item => item.id === id);
    
    if (index !== -1) {
        rsvpData.splice(index, 1);
        saveDataToFile();
        
        // Broadcast updated data
        io.emit('data-updated', {
            data: rsvpData,
            stats: calculateStats()
        });
        
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy mục này' });
    }
});

app.get('/download-excel', requireAuth, async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Guest List');

        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 10 },
            { header: 'Tên Khách Mời', key: 'name', width: 30 },
            { header: 'Xác Nhận Tham Dự', key: 'attendance', width: 30 },
            { header: 'Lời Nhắn', key: 'message', width: 50 },
            { header: 'Thời Gian Gửi', key: 'submittedAt', width: 20 }
        ];

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6FA' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        rsvpData.forEach((item, index) => {
            const row = worksheet.addRow({
                stt: index + 1,
                name: item.name,
                attendance: item.attendance,
                message: item.message || 'Không có lời nhắn',
                submittedAt: item.submittedAt
            });

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        worksheet.addRow([]);
        worksheet.addRow(['THỐNG KÊ']);
        
        const attending = rsvpData.filter(item => item.attendance === 'I will definitely attend').length;
        const notAttending = rsvpData.filter(item => item.attendance === 'Sorry, I will be busy').length;
        const pending = rsvpData.filter(item => item.attendance === 'I will let you know later').length;
        
        worksheet.addRow(['Tổng phản hồi:', rsvpData.length]);
        worksheet.addRow(['Sẽ tham dự:', attending]);
        worksheet.addRow(['Không thể tham dự:', notAttending]);
        worksheet.addRow(['Chưa quyết định:', pending]);

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Guest_List_${new Date().toISOString().split('T')[0]}.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Lỗi tạo file Excel:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Không thể tạo file Excel!' 
        });
    }
});

let rsvpData = [];

const recentSubmissions = new Map();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_SUBMISSIONS_PER_WINDOW = 1;

const cleanupOldSubmissions = () => {
    const now = Date.now();
    for (const [key, timestamp] of recentSubmissions.entries()) {
        if (now - timestamp > RATE_LIMIT_WINDOW) {
            recentSubmissions.delete(key);
        }
    }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('✅ A user has connected:', socket.id);
    
    const initialData = {
        data: rsvpData,
        stats: calculateStats()
    };
    console.log('📤 Sending initial-data to client:', socket.id, initialData);
    socket.emit('initial-data', initialData);
    
    socket.emit('test', { message: 'Kiểm tra kết nối thành công!' });
    
    socket.on('disconnect', () => {
        console.log('❌ User has disconnected:', socket.id);
    });
});

const calculateStats = () => {
    return {
        total: rsvpData.length,
        attending: rsvpData.filter(item => item.attendance === 'I will definitely attend').length,
        notAttending: rsvpData.filter(item => item.attendance === 'Sorry, I will be busy').length,
        pending: rsvpData.filter(item => item.attendance === 'I will let you know later').length
    };
};

const loadExistingData = () => {
    try {
        if (fs.existsSync('rsvp_data.json')) {
            const data = fs.readFileSync('rsvp_data.json', 'utf8');
            rsvpData = JSON.parse(data);
        }
    } catch (error) {
        console.log('Không thể tải dữ liệu hiện có:', error.message);
    }
};

const saveDataToFile = () => {
    try {
        fs.writeFileSync('rsvp_data.json', JSON.stringify(rsvpData, null, 2));
    } catch (error) {
        console.log('Lỗi lưu dữ liệu:', error.message);
    }
};

app.post('/submit-rsvp', (req, res) => {
    try {
        const { name, message, form_item4 } = req.body;
        
        if (!name || !form_item4) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' 
            });
        }

        cleanupOldSubmissions();

        const submissionKey = `${name.trim()}_${form_item4}_${message ? message.trim() : ''}`;
        const now = Date.now();
        
        if (recentSubmissions.has(submissionKey)) {
            const lastSubmission = recentSubmissions.get(submissionKey);
            if (now - lastSubmission < RATE_LIMIT_WINDOW) {
                console.log('⚠️ Duplicate submission detected:', submissionKey);
                return res.status(429).json({ 
                    success: false, 
                    message: 'Vui lòng đợi trước khi gửi lại!' 
                });
            }
        }

        const newRsvp = {
            id: now,
            name: name.trim(),
            message: message ? message.trim() : '',
            attendance: form_item4,
            submittedAt: new Date().toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh'
            })
        };

        const existingDuplicate = rsvpData.find(item => 
            item.name === newRsvp.name && 
            item.message === newRsvp.message && 
            item.attendance === newRsvp.attendance &&
            (now - item.id) < RATE_LIMIT_WINDOW
        );

        if (existingDuplicate) {
            console.log('⚠️ Duplicate record in database:', existingDuplicate);
            return res.status(409).json({ 
                success: false, 
                message: 'Bạn đã gửi thông tin này rồi!' 
            });
        }

        recentSubmissions.set(submissionKey, now);

        rsvpData.push(newRsvp);
        
        saveDataToFile();

        console.log('✅ Received new RSVP (not duplicate):', newRsvp);

        const broadcastData = {
            data: newRsvp,
            stats: calculateStats(),
            allData: rsvpData
        };
        console.log('📤 Broadcasting new-rsvp event:', broadcastData);
        io.emit('new-rsvp', broadcastData);

        // Return success response
        res.json({ 
            success: true, 
            message: 'Cảm ơn bạn đã xác nhận!',
            data: newRsvp
        });

    } catch (error) {
        console.error('Lỗi xử lý RSVP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi, vui lòng thử lại!' 
        });
    }
});

loadExistingData();

app.use(express.static('kientrinhwedding'));

server.listen(PORT, () => {
    console.log(`🌸 Server is running at http://localhost:${PORT}`);
}); 