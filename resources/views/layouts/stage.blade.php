<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Stage Mode - Teleprompter & Soundboard')</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/stage-mode.css') }}">
</head>
<body class="stage-body">
    @yield('content')

    <script src="{{ asset('js/soundboard.js') }}"></script>
    <script src="{{ asset('js/teleprompter.js') }}"></script>
    <script src="{{ asset('js/live-sync.js') }}"></script>
    @yield('extra_js')
</body>
</html>
