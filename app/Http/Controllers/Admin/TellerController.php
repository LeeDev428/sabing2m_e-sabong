<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class TellerController extends Controller
{
    public function getTellers()
    {
        $tellers = User::where('role', 'teller')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($tellers);
    }
}
