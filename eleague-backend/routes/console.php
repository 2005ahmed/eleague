<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command(
    'tournaments:start-ready'
)->everyMinute();
