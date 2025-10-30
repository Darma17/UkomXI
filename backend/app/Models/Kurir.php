<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kurir extends Model
{
    /** @use HasFactory<\Database\Factories\KurirFactory> */
    use HasFactory;

    protected $fillable = ['nama', 'harga'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
