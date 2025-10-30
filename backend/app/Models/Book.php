<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'title', 'author', 'publisher', 'publish_year',
        'description', 'price', 'modal_price', 'stock', 'cover_image', 'is_highlight',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function bookDiscounts()
    {
        return $this->hasMany(BookDiscount::class);
    }

    /**
     * Ambil harga setelah diskon (jika ada yang aktif)
     */
    public function getDiscountedPriceAttribute()
    {
        $activeDiscount = $this->bookDiscounts()
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now())
            ->orderByDesc('percentage')
            ->first();

        if ($activeDiscount) {
            return $this->price - ($this->price * $activeDiscount->percentage / 100);
        }

        return $this->price;
    }

}
