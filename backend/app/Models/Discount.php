<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'percentage', 'start_date', 'end_date'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
