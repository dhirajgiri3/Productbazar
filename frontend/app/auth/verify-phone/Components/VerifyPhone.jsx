// src/Pages/auth/verify-phone.jsx

"use client";

import React from "react";
import VerifyPhoneLeft from "../Components/VerifyPhoneLeft";
import AuthRight from "../../Common/AuthRight";
import withVerifiedUser from "../AuthProtector/withVerifiedUser";
function VerifyPhone() {
  return (
    <div className="flex justify-center items-center min-h-screen py-10">
      {/* Left Side */}
      <div className="flex-1">
        <VerifyPhoneLeft />
      </div>

      {/* Right Side */}
      <div className="hidden sm:flex flex-1 justify-center items-center border-l border-dashed border-border">
        <AuthRight
          title={
            <>
              Verify Your <span className="text-accent">Phone Number</span>
            </>
          }
          description={
            <>
              Enter the OTP sent to your phone to complete the verification
              process and secure your account.
            </>
          }
        />
      </div>
    </div>
  );
}

export default withVerifiedUser(VerifyPhone);
