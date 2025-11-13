# Generate Video Web App

Ứng dụng Next.js để tạo video từ văn bản và ảnh sử dụng AI.

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install -g pnpm

corepack enable
corepack prepare pnpm@latest --activate

pnpm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

#### Lấy KIE API Key:
1. Truy cập https://kie.ai
2. Đăng ký/đăng nhập tài khoản
3. Lấy API key từ dashboard
4. Thêm vào `.env.local`: `KIE_API_KEY=your_key_here`

#### Lấy Cloudinary Credentials (bắt buộc cho tính năng upload ảnh):
1. Truy cập https://cloudinary.com và đăng ký tài khoản miễn phí
2. Vào Dashboard, copy các giá trị:
   - **Cloud Name**
   - **API Key** 
   - **API Secret**
3. Thêm vào `.env.local`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Chạy ứng dụng

```bash
pnpm dev
```

Mở http://localhost:3000 để sử dụng.

## Tính năng

- ✅ Tạo video từ văn bản (text-to-video)
- ✅ Tạo video từ ảnh + văn bản (image-to-video)
- ✅ Upload ảnh lên cloud storage (Cloudinary)
- ✅ Polling tự động để theo dõi tiến trình tạo video
- ✅ Hiển thị video kết quả trực tiếp trong chat
