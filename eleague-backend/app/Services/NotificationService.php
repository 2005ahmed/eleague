<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public static function send(
        User $user,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'is_read' => false,
            'data' => $data,
        ]);
    }

    public static function sendToMany(
        $users,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        foreach ($users as $user) {
            self::send(
                $user,
                $type,
                $title,
                $message,
                $data
            );
        }
    }
}
