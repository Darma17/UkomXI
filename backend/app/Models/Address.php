<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'receiver_name', 'phone', 'address_line', 'city', 'province', 'postal_code'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
