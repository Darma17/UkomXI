<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Mime\Part\TextPart;
use Illuminate\Support\Str;
use Carbon\Carbon;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','regex:/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/u'],
            'email' => 'required|email|unique:users',
            'password' => ['required','min:8','regex:/^[A-Za-z0-9]+$/'],
            'role' => 'in:customer,admin,operator',
            'tempat_lahir' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',
        ], [
            'name.regex' => 'Nama hanya boleh berisi huruf dan spasi',
            'password.regex' => 'Password hanya boleh berisi huruf dan angka',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        // kolom opsional otomatis ikut karena fillable
        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|regex:/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/u',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:customer,admin,operator',
            // file upload tanpa bergantung pada mimetypes/image
            'profile_image' => 'nullable|file|max:5120',
            'profile_image_path' => 'sometimes|string',
            'tempat_lahir' => 'sometimes|nullable|string',
            'tanggal_lahir' => 'sometimes|nullable|date',
        ], [
            'name.regex' => 'Nama hanya boleh berisi huruf dan spasi',
        ]);

        // Validasi umur jika tanggal_lahir diisi: minimal 15, maksimal 100 tahun
        if ($request->filled('tanggal_lahir')) {
            try {
                $dob = Carbon::parse($request->input('tanggal_lahir'));
                $age = $dob->age;
                if ($age < 15 || $age > 100) {
                    return response()->json(['message' => 'Umur harus antara 15 hingga 100 tahun'], 422);
                }
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Format tanggal lahir tidak valid'], 422);
            }
        }

        try {
            // 1) Upload file (tanpa finfo, pakai move())
            if ($request->hasFile('profile_image')) {
                $file = $request->file('profile_image');
                if (! $file->isValid()) {
                    Log::warning('Invalid upload for profile_image', ['user_id' => $user->id]);
                    return response()->json(['message' => 'File upload tidak valid'], 422);
                }

                $origName = (string) $file->getClientOriginalName();
                $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                $allowed = ['jpg','jpeg','png','webp'];
                if (!in_array($ext, $allowed, true)) {
                    Log::warning('Unsupported profile_image extension', ['user_id' => $user->id, 'ext' => $ext, 'name' => $origName]);
                    return response()->json(['message' => 'Ekstensi file tidak didukung. Izinkan: jpg, jpeg, png, webp'], 422);
                }

                // siapkan direktori tujuan (storage/app/public/profile)
                $dest = storage_path('app/public/profile');
                if (!is_dir($dest)) {
                    @mkdir($dest, 0775, true);
                }

                $filename = 'u'.$user->id.'_'.time().'_'.\Illuminate\Support\Str::random(6).'.'.$ext;
                $targetPath = $dest.DIRECTORY_SEPARATOR.$filename;
                $relative = 'profile/'.$filename;

                // Pindahkan file tanpa melalui Storage (hindari finfo)
                $file->move($dest, $filename);

                if (!is_file($targetPath)) {
                    Log::error('Gagal menyimpan file ke disk public (move failed)', ['user_id' => $user->id, 'path' => $targetPath]);
                    return response()->json(['message' => 'Gagal menyimpan file'], 500);
                }

                // hapus foto lama jika ada (pakai unlink)
                if (!empty($user->profile_image)) {
                    $oldAbs = storage_path('app/public/'.ltrim($user->profile_image, '/'));
                    if (is_file($oldAbs)) {
                        @unlink($oldAbs);
                    }
                }

                $user->profile_image = $relative;
            }
            // 2) Set dari path yang sudah ada
            elseif ($request->filled('profile_image_path')) {
                $raw = (string) $request->input('profile_image_path');
                $normalized = str_starts_with($raw, 'profile/') ? $raw : ('profile/' . ltrim($raw, '/'));
                $abs = storage_path('app/public/'.$normalized);
                if (!is_file($abs)) {
                    return response()->json(['message' => 'File tidak ditemukan di storage/public', 'path_checked' => $normalized], 422);
                }
                if (!empty($user->profile_image)) {
                    $oldAbs = storage_path('app/public/'.ltrim($user->profile_image, '/'));
                    if (is_file($oldAbs)) {
                        @unlink($oldAbs);
                    }
                }
                $user->profile_image = $normalized;
            }

            if ($request->has('name')) { $user->name = (string)$request->input('name'); }
            if ($request->has('email')) { $user->email = (string)$request->input('email'); }
            if ($request->has('role'))  { $user->role  = (string)$request->input('role'); }
            if ($request->has('tempat_lahir')) { $user->tempat_lahir = $request->input('tempat_lahir'); }
            if ($request->has('tanggal_lahir')) { $user->tanggal_lahir = $request->input('tanggal_lahir'); }

            $user->save();
            return response()->json($user);
        } catch (\Throwable $e) {
            Log::error('Failed to update user/profile image', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal memperbarui profil'], 500);
        }
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    // New: login for customer
    public function loginCustomer(Request $request)
    {
        return $this->handleLogin($request, 'customer');
    }

    // New: login for admin
    public function loginAdmin(Request $request)
    {
        return $this->handleLogin($request, 'admin');
    }
    // New: login for operator
    public function loginOperator(Request $request)
    {
        return $this->handleLogin($request, 'operator');
    }

    // Helper to validate credentials, role, generate OTP, send email, and cache OTP
    protected function handleLogin(Request $request, string $requiredRole)
    {
        // ✅ Validasi input termasuk captchaToken
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'captchaToken' => 'required|string',
        ]);

        // ✅ Verifikasi token reCAPTCHA ke server Google
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => env('RECAPTCHA_SECRET_KEY'), // tambahkan di .env
            'response' => $validated['captchaToken'],
        ]);

        if (!$response->successful() || !$response->json('success')) {
            Log::warning('Captcha verification failed', [
                'email' => $validated['email'],
                'response' => $response->json(),
            ]);

            return response()->json(['message' => 'Verifikasi captcha gagal'], 400);
        }

        // ✅ Proses login seperti biasa
        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Email atau Password Salah'], 401);
        }

        if ($requiredRole && $user->role !== $requiredRole) {
            return response()->json(['message' => 'Unauthorized role'], 403);
        }

        // Generate 6-digit OTP
        $otp = random_int(100000, 999999);
        $cacheKey = 'otp:' . $user->email;
        Cache::put($cacheKey, $otp, now()->addMinutes(5));

        // Email OTP (HTML)
        $html = '
        <!doctype html>
        <html><head><meta charset="utf-8"></head>
        <body style="font-family: Arial; background:#f4f6f8; margin:0; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:8px; padding:30px;">
            <h2 style="text-align:center;">Kode OTP BukuKu</h2>
            <p style="text-align:center;">Gunakan kode di bawah untuk login:</p>
            <div style="text-align:center; font-size:24px; font-weight:bold; margin:20px 0;">' . $otp . '</div>
            <p style="color:#888; text-align:center;">Kode berlaku selama 5 menit.</p>
        </div>
        </body></html>';

        try {
            Mail::html($html, function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Kode OTP BukuKu')
                    ->from(config('mail.from.address'), config('mail.from.name', 'BukuKu'));
            });
        } catch (\Throwable $e) {
            Cache::forget($cacheKey);
            Log::error('Gagal kirim OTP', ['email' => $user->email, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal mengirim OTP. Periksa konfigurasi email.'], 500);
        }

        return response()->json(['message' => 'OTP dikirim ke email', 'email' => $user->email], 200);
    }

    // Verify OTP and issue Sanctum token
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
            'device_name' => 'sometimes|string' // optional device name for token
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (! $user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        $cacheKey = 'otp:' . $user->email;
        $cachedOtp = Cache::get($cacheKey);

        if (! $cachedOtp || (string)$cachedOtp !== (string)$validated['otp']) {
            return response()->json(['message' => 'Kode OTP salah atau expire'], 401);
        }

        // OTP valid -> remove from cache and create Sanctum token
        Cache::forget($cacheKey);

        $device = $validated['device_name'] ?? 'web';
        $token = $user->createToken($device)->plainTextToken;

        return response()->json([
            'message' => 'OTP verified',
            'token' => $token,
            'user' => $user
        ], 200);
    }

    // Logout: revoke current token (protected route)
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Logged out']);
    }

    // Send OTP for password reset
    public function sendResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (! $user) {
            // Do not reveal whether email exists — but for UX we'll return 200 with message
            return response()->json(['message' => 'If the email is registered, an OTP has been sent.'], 200);
        }

        $otp = random_int(100000, 999999);
        $cacheKey = 'reset-otp:' . $user->email;
        Cache::put($cacheKey, $otp, now()->addMinutes(5));

        $html = '<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial, sans-serif"><div style="max-width:600px;margin:auto;padding:24px;border-radius:8px;background:#fff"><h3 style="margin:0 0 12px;color:#111">Reset Password — BukuKu</h3><p style="color:#333;margin:0 0 12px">Gunakan kode berikut untuk mereset password Anda. Kode berlaku 5 menit.</p><div style="font-weight:700;font-size:28px;letter-spacing:4px;padding:16px;border-radius:8px;background:#f7fafc;border:1px solid #e6eef7;text-align:center">' . $otp . '</div></div></body></html>';

        try {
            Mail::html($html, function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Reset Password OTP')
                    ->from(config('mail.from.address', env('MAIL_FROM_ADDRESS')), config('mail.from.name', env('MAIL_FROM_NAME', 'BukuKu')));
            });
        } catch (\Throwable $e) {
            Log::error('Gagal mengirim OTP', [
                'email' => $user->email,
                'error' => $e->getMessage()
            ]);
            Cache::forget($cacheKey);
            return response()->json(['message' => 'Gagal mengirim OTP.'], 500);
        }

        return response()->json(['message' => 'If the email is registered, an OTP has been sent.'], 200);
    }

    // Verify reset OTP and return short-lived reset token
    public function verifyResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6'
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (! $user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        $cacheKey = 'reset-otp:' . $user->email;
        $cachedOtp = Cache::get($cacheKey);

        if (! $cachedOtp || (string)$cachedOtp !== (string)$validated['otp']) {
            return response()->json(['message' => 'Kode OTP salah atau expired'], 401);
        }

        // valid -> create reset token and store for short time
        $resetToken = Str::random(48);
        $tokenKey = 'reset-token:' . $user->email;
        Cache::put($tokenKey, $resetToken, now()->addMinutes(10));

        // remove the used otp
        Cache::forget($cacheKey);

        return response()->json(['message' => 'OTP valid', 'reset_token' => $resetToken], 200);
    }

    // Reset password using reset token
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'reset_token' => 'required|string',
            'password' => ['required','min:8','regex:/^[A-Za-z0-9]+$/','confirmed'],
        ], [
            'password.regex' => 'Password hanya boleh berisi huruf dan angka',
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (! $user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        $tokenKey = 'reset-token:' . $user->email;
        $cachedToken = Cache::get($tokenKey);

        if (! $cachedToken || $cachedToken !== $validated['reset_token']) {
            return response()->json(['message' => 'Reset token invalid atau expired'], 401);
        }

        // update password
        $user->password = Hash::make($validated['password']);
        $user->save();

        // cleanup token
        Cache::forget($tokenKey);

        return response()->json(['message' => 'Password berhasil diubah'], 200);
    }

    // Request register OTP (do not create user yet)
    public function sendRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','regex:/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/u'],
            'email' => 'required|email',
            'password' => ['required','min:8','regex:/^[A-Za-z0-9]+$/','confirmed'],
        ], [
            'name.regex' => 'Nama hanya boleh berisi huruf dan spasi',
            'password.regex' => 'Password hanya boleh berisi huruf dan angka',
        ]);

        // if email already used, return error
        if (User::where('email', $validated['email'])->exists()) {
            return response()->json(['message' => 'Email sudah terdaftar'], 422);
        }

        // generate OTP and store pending registration data in cache
        $otp = random_int(100000, 999999);
        $otpKey = 'register-otp:' . $validated['email'];
        $userKey = 'register-user:' . $validated['email'];

        Cache::put($otpKey, $otp, now()->addMinutes(5));
        // store hashed password to avoid keeping plain password
        Cache::put($userKey, [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'customer'
        ], now()->addMinutes(10));

        $html = '<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial, sans-serif"><div style="max-width:600px;margin:auto;padding:24px;border-radius:8px;background:#fff"><h3 style="margin:0 0 12px;color:#111">Konfirmasi Pendaftaran — BukuKu</h3><p style="color:#333;margin:0 0 12px">Gunakan kode berikut untuk menyelesaikan pendaftaran Anda. Kode berlaku 5 menit.</p><div style="font-weight:700;font-size:28px;letter-spacing:4px;padding:16px;border-radius:8px;background:#f7fafc;border:1px solid #e6eef7;text-align:center">' . $otp . '</div></div></body></html>';

        try {
            Mail::html($html, function ($message) use ($validated) {
                $message->to($validated['email'])
                    ->subject('OTP Pendaftaran BukuKu')
                    ->from(config('mail.from.address', env('MAIL_FROM_ADDRESS')), config('mail.from.name', env('MAIL_FROM_NAME', 'BukuKu')));
            });
        } catch (\Throwable $e) {
            // clean up cache
            Cache::forget($otpKey);
            Cache::forget($userKey);
            Log::error('Gagal mengirim OTP pendaftaran', ['email' => $validated['email'], 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal mengirim OTP. Periksa konfigurasi email.'], 500);
        }

        return response()->json(['message' => 'OTP pendaftaran telah dikirim ke email jika terdaftar'], 200);
    }

    // Verify register OTP and create user
    public function verifyRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6'
        ]);

        $user = User::where('email', $validated['email'])->first();
        // If a user already exists (race), block
        if ($user) {
            return response()->json(['message' => 'Email sudah terdaftar'], 422);
        }

        $otpKey = 'register-otp:' . $validated['email'];
        $userKey = 'register-user:' . $validated['email'];

        $cachedOtp = Cache::get($otpKey);
        $pending = Cache::get($userKey);

        if (! $cachedOtp || (string)$cachedOtp !== (string)$validated['otp'] || ! $pending) {
            return response()->json(['message' => 'Kode OTP salah atau expired'], 401);
        }

        // create user from pending data
        $newUser = User::create([
            'name' => $pending['name'],
            'email' => $pending['email'],
            'password' => $pending['password'],
            'role' => $pending['role'] ?? 'customer'
        ]);

        // cleanup cache
        Cache::forget($otpKey);
        Cache::forget($userKey);

        // create Sanctum token and return it so client can auto-login
        try {
            $token = $newUser->createToken('register')->plainTextToken;
        } catch (\Throwable $e) {
            Log::error('Failed to create token after register', ['err' => $e->getMessage(), 'user_email' => $newUser->email]);
            return response()->json(['message' => 'Pendaftaran berhasil, tetapi gagal membuat sesi otomatis. Silakan login.'], 201);
        }

        return response()->json([
            'message' => 'Pendaftaran berhasil',
            'user' => $newUser,
            'token' => $token
        ], 201);
    }
    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        // Verifikasi token Google (id_token)
        try {
            $response = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . $request->token);
            $googleUser = json_decode($response, true);
        } catch (\Throwable $e) {
            $googleUser = null;
        }

        if (!is_array($googleUser) || !isset($googleUser['email'])) {
            return response()->json(['message' => 'Token Google tidak valid'], 401);
        }

        $email = $googleUser['email'];

        // Jika user belum ada, buat otomatis (role customer)
        $user = \App\Models\User::where('email', $email)->first();
        if (! $user) {
            $name = $googleUser['name'] ?? explode('@', $email)[0];
            $user = \App\Models\User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(16)),
                'role' => 'customer',
                'profile_image' => null,
            ]);
        }

        // Buat dan kembalikan token Sanctum (client akan simpan dan redirect ke beranda)
        $token = $user->createToken('google-login')->plainTextToken;

        return response()->json([
            'message' => 'Login Google berhasil',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    // Upload foto profil untuk user yang sedang login (via Sanctum)
    public function uploadProfileImage(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'profile_image' => 'nullable|file|max:5120',
            'image'         => 'nullable|file|max:5120',
        ]);

        try {
            $file = $request->file('profile_image') ?? $request->file('image');
            if (! $file) {
                Log::warning('No file received for profile_image', ['user_id' => $user->id]);
                return response()->json(['message' => 'Tidak ada file yang diunggah (gunakan key: profile_image atau image)'], 422);
            }
            if (! $file->isValid()) {
                Log::warning('Invalid upload for profile_image', ['user_id' => $user->id]);
                return response()->json(['message' => 'File upload tidak valid'], 422);
            }

            $origName = (string) $file->getClientOriginalName();
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $allowed = ['jpg','jpeg','png','webp'];
            if (!in_array($ext, $allowed, true)) {
                Log::warning('Unsupported profile_image extension', ['user_id' => $user->id, 'ext' => $ext, 'name' => $origName]);
                return response()->json(['message' => 'Ekstensi file tidak didukung. Izinkan: jpg, jpeg, png, webp'], 422);
            }

            Log::info('Incoming profile image', [
                'user_id' => $user->id,
                'size'    => $file->getSize(),
                'name'    => $origName,
                'ext'     => $ext,
            ]);

            // tulis manual dengan move() — tidak lewat Storage (hindari finfo)
            $dest = storage_path('app/public/profile');
            if (!is_dir($dest)) {
                @mkdir($dest, 0775, true);
            }

            $filename = 'u'.$user->id.'_'.time().'_'.\Illuminate\Support\Str::random(6).'.'.$ext;
            $targetPath = $dest.DIRECTORY_SEPARATOR.$filename;
            $relative = 'profile/'.$filename;

            $file->move($dest, $filename);

            if (!is_file($targetPath)) {
                Log::error('Gagal menyimpan file ke disk public (move failed)', ['user_id' => $user->id, 'path' => $targetPath]);
                return response()->json(['message' => 'Gagal menyimpan file (cek permission storage/app/public dan symlink)'], 500);
            }

            // hapus foto lama jika ada
            if (!empty($user->profile_image)) {
                $oldAbs = storage_path('app/public/'.ltrim($user->profile_image, '/'));
                if (is_file($oldAbs)) {
                    @unlink($oldAbs);
                }
            }

            $user->profile_image = $relative;
            $user->save();

            Log::info('Profile image updated', ['user_id' => $user->id, 'path' => $relative]);
            return response()->json($user, 200);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Upload profile image failed', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Gagal memperbarui profil: ' . $e->getMessage()], 500);
        }
    }
    // Kirim pesan "Hubungi Kami" ke email admin (Gmail)
    public function contact(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:190',
            'email' => 'required|email',
            'subject' => 'required|string|max:190',
            'message' => 'required|string',
        ]);

        // Tujuan email (Gmail Anda)
        $to = 'bukuku.real@gmail.com';

        $html = '
        <!doctype html><html><head><meta charset="utf-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f7f9fb;margin:0;padding:20px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8eef4;border-radius:10px;overflow:hidden;">
            <div style="background:#111;color:#fff;padding:16px 20px;font-weight:700">Pesan Baru — Hubungi Kami (BukuKu)</div>
            <div style="padding:20px">
              <p style="margin:0 0 8px;color:#111"><strong>Nama:</strong> '.htmlspecialchars($data['name']).'</p>
              <p style="margin:0 0 8px;color:#111"><strong>Email:</strong> '.htmlspecialchars($data['email']).'</p>
              <p style="margin:0 0 12px;color:#111"><strong>Subjek:</strong> '.htmlspecialchars($data['subject']).'</p>
              <div style="margin-top:12px;padding:14px;border:1px solid #e8eef4;border-radius:8px;background:#fafbfc;color:#333;white-space:pre-wrap;">'
                . nl2br(e($data['message'])) .
              '</div>
            </div>
            <div style="padding:12px 20px;background:#fafafa;border-top:1px solid #eef2f6;color:#888;font-size:12px">Email ini dikirim otomatis dari formulir Hubungi Kami.</div>
          </div>
        </body></html>';

        try {
            \Illuminate\Support\Facades\Mail::html($html, function ($m) use ($to, $data) {
                $m->to($to)
                  ->subject('[BukuKu] ' . $data['subject'])
                  ->from(config('mail.from.address', env('MAIL_FROM_ADDRESS')), config('mail.from.name', env('MAIL_FROM_NAME', 'BukuKu')));
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Contact mail failed', ['err' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal mengirim email'], 500);
        }

        return response()->json(['message' => 'Pesan terkirim'], 200);
    }
}

