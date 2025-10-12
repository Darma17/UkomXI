<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'percentage',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * Cek apakah diskon masih berlaku hari ini.
     */
    public function isActive()
    {
        $today = now()->toDateString();
        return $this->start_date <= $today && $this->end_date >= $today;
    }
}
