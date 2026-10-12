<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command(
    'tournaments:auto-start'
)->everyMinute();
