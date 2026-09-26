<?php
$ctx = stream_context_create(['http'=>['ignore_errors'=>true]]);
$res = file_get_contents('http://localhost:9000/api/cms/packages', false, $ctx);
echo "RESPONSE:\n" . $res . "\n";
