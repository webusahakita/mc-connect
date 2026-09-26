<?php
$lines = file('public/js/admin-core.js');
$new_lines = array_slice($lines, 38);
file_put_contents('public/js/admin-core.js', implode('', $new_lines));
echo "Fixed!\n";
