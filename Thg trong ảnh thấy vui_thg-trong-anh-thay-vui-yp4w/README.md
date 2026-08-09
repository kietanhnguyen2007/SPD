# Team Crystallizer 🔮

## 1. Tên và mô tả ngắn của sản phẩm
- **Tên sản phẩm**: Team Crystallizer
- **Mô tả ngắn**: Hệ thống ghép đội (Team-Matching) thông minh dành cho các cuộc thi Hackathon, giúp tìm kiếm và xây dựng đội ngũ tối ưu dựa trên dữ liệu kỹ năng và kinh nghiệm thực tế.

## 2. Bài toán mà sản phẩm giải quyết
Việc tìm kiếm đồng đội trong các cuộc thi Hackathon thường diễn ra thủ công, dựa vào cảm tính hoặc quen biết, dẫn đến tình trạng mất cân bằng kỹ năng trong nhóm (ví dụ: dư thừa Frontend nhưng thiếu Backend/Database). Team Crystallizer giải quyết bài toán này bằng cách sử dụng thuật toán tối ưu hóa để ghép đúng người, đúng việc, đảm bảo một đội ngũ hoàn chỉnh và cân bằng nhất.

## 3. Danh sách tính năng chính
- **Khởi tạo mục tiêu**: Cho phép định nghĩa số lượng thành viên, số năm kinh nghiệm tối thiểu, và các kỹ năng bắt buộc.
- **Ghép đội bằng Thuật toán**: Sử dụng thuật toán Constraint Satisfaction Problem kết hợp Bitmask siêu tốc để tìm đội hình tối ưu nhất mà không trùng lặp thành viên.
- **Báo cáo minh bạch**: Hiển thị rõ ràng ánh xạ giữa kỹ năng yêu cầu và thành viên đảm nhận, giải thích chi tiết lý do lựa chọn.
- **Tính năng Đề xuất Thỏa hiệp (Trade-off Cards)**: Khi yêu cầu quá khắt khe và không có kết quả, hệ thống không báo lỗi cứng ngắc mà đưa ra các phương án thỏa hiệp (ví dụ: giảm yêu cầu kinh nghiệm) để người dùng lựa chọn.
- **Tính năng Ghép nối linh hoạt (Flexible Match)**: Chấp nhận các kỹ năng lân cận (ví dụ: Data Science có thể thay thế cho Machine Learning) khi hệ thống ở chế độ linh hoạt.

## 4. Công nghệ và các phụ thuộc được sử dụng
- **Công nghệ**: HTML5, CSS3, Vanilla JavaScript (ES Modules).
- **Phụ thuộc (Dependencies)**: Sử dụng gói `serve` (thông qua `npx` hoặc `npm install`) để tạo local server phát triển. Cấu hình được khai báo trong `package.json`.

## 5. Hướng dẫn cài đặt và chạy dự án
Dự án được xây dựng với Vanilla JS, chỉ cần một local server để phục vụ file HTML.
```bash
# Cài đặt phụ thuộc
npm install

# Chạy dự án (khởi động server tại cổng 5173)
npm run dev
```
Sau đó truy cập vào địa chỉ được hiển thị trên Terminal (thường là `http://localhost:5173`).

## 6. Mô tả cấu trúc thư mục
```
[TênĐội]_[Tên đăng nhập]/
├── README.md             # Tài liệu hướng dẫn dự án (file này)
├── chatlog.md            # Lịch sử tương tác với AI
├── submission.json       # Tệp khai báo cấu trúc nộp bài
├── .gitignore            # Loại trừ các file/thư mục không cần thiết
├── package.json          # Tệp khai báo phụ thuộc và script chạy
└── src/                  # Thư mục mã nguồn chính của dự án
    ├── index.html        # Giao diện chính
    ├── css/              # Chứa các tệp CSS (styles.css)
    ├── js/               # Mã nguồn JavaScript cốt lõi
    ├── data/             # Cơ sở dữ liệu JSON giả lập (ứng viên, mục tiêu)
    └── tests/            # Các tệp Unit test kiểm thử thuật toán
```

## 7. Tên đội và vai trò của hai thành viên
- **Tên đội**: Thg trong ảnh thấy vui (login: `thg-trong-anh-thay-vui-yp4w`)
- **Vai trò**:
  - **Thành viên 1**: Đảm nhiệm phát triển thuật toán (Algorithm/Logic), quản lý cấu trúc dữ liệu.
  - **Thành viên 2**: Đảm nhiệm phát triển giao diện (UI/UX), thiết kế luồng trải nghiệm người dùng.
