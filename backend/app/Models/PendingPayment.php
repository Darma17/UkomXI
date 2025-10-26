<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendingPayment extends Model
{
    use HasFactory;

    protected $fillable = ['midtrans_order_id', 'user_id', 'payload', 'total'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
