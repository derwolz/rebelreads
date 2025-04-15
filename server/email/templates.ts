/**
 * Email templates for the application
 */

/**
 * Welcome email template sent to users after signup
 */
export const welcomeEmailTemplate = (username: string) => {
  return {
    subject: "Welcome to Sirened Beta",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #102B3F; background-color: #F6F0FB; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <!-- Sirened Logo - SVG embedded as base64 -->
          <svg width="200" height="80" viewBox="0 0 248 164" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 15px;">
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:1.9;" d="M106.12447,103.90686C158.60476,90.929392,213.46197,79.263842,249.66056,92.262052l-2.71272,1.13001C205.78547,80.920032,99.678381,109.61774,96.833749,119.52148Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="M71.505387,9.0161418C61.596771,44.0651,31.213375,57.767123,7.4727349,73.916703l1.4347442,4.15215C120.42306,50.092823,95.924471,140.12627,64.414047,160.01735l5.989347-5.0837C120.21411,111.64204,102.1536,64.729309,28.004715,68.221582,75.564889,24.747276,73.785532,11.440416,72.797766,10.365844Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="M114.92969,9.4513098C96.597511,39.480114,79.241393,44.884113,61.688923,55.241756l2.008314,2.710175C140.26895,74.79639,85.784041,106.10292,86.218271,137.86447l10.2959-17.52888C100.9118,101.34222,136.4546,74.935443,76.441215,53.82625,102.06531,35.796364,108.14064,23.612948,115.97441,10.903639Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="m138.9731,21.294919c-9.04889,14.045077-19.08261,24.584493-30.64932,29.667076,1.10254,0.491967,1.57178,0.5994,2.01356,0.877041,33.64716,14.167333,11.57992,23.271074-16.390779,73.418704l-9.57609,14.52493C104.24071,97.612868,151.91432,74.396671,118.58823,51.245149,128.96755,40.930331,135.05852,32.338207,139.64091,22.307061Z"/>
            <!-- Sirened text -->
            <g transform="translate(17.480896,1.8823242)" style="fill:#A06CD5;stroke:#A06CD5;">
              <path d="m124.043,57.367167q0,0.415364,0.0143,0.802083,0.0143,0.372395,0.0143,0.730468,0,0.845051-0.14322,1.446613-0.14323,0.601561-0.67318,0.959634-0.3151,0.229166-0.78776,0.529947-0.78776,0.515625-2.53515,1.575519,0.17187-0.458333,0.24349-1.102863,0.0859-0.658853,0.11458-1.246092,0.0286-0.6875,0-1.43229,0.90234-0.472656,1.58984-0.873697,0.6875-0.415364,1.17448-0.730468,0.57291-0.358073,0.98828-0.658854zM129.08613,81.77339q-1.63281,1.074218-2.77864,1.690103-1.13151,0.615884-1.94792,0.916665-0.8164,0.300781-1.375,0.34375-0.55859,0.04297-1.01692-0.04297-0.41537-0.07161-0.81641-0.214843-0.40104-0.143229-0.73047-0.515625-0.3151-0.386718-0.51562-1.102863-0.20052-0.716145-0.20052-1.947915,0-1.031248,0.0573-2.033851,0.0573-1.016926,0.11458-2.005206,0.0716-1.002603,0.10026-1.976561,0.043-0.98828,0.0143-1.962237-0.0286-0.945311-0.34375-1.374998-0.31511-0.44401-0.94531-0.44401-0.24349,0-0.52995,0.05729-0.28646,0.05729-0.61589,0.171875,0.51563-0.358072,1.0599-0.716145,0.54427-0.372395,1.10286-0.658853,0.5586-0.286458,1.11719-0.458333,0.57291-0.186198,1.13151-0.186198,0.60156,0,1.04557,0.272135,0.45833,0.272135,0.58724,0.902343,0.043,0.243489,0.0573,0.716145,0.0286,0.472656,0.0286,1.102863,0,0.930989-0.043,2.062498-0.0286,1.131509-0.0716,2.234372-0.043,1.088541-0.0859,2.019529-0.043,0.916666-0.0573,1.417967-0.0143,0.472656,0.17188,0.945312,0.1862,0.472656,0.54427,0.859374,0.37239,0.372395,0.90234,0.615885,0.54427,0.229166,1.23177,0.229166,0.60156,0,1.30338-0.214844,0.70183-0.214843,1.50391-0.701822Z" style="fill:#A06CD5;stroke:#A06CD5;"/>
              <path d="m134.69924,72.535119q0.67317-0.644531,1.46093-1.289061,0.80208-0.644531,1.61849-1.160155,0.83073-0.529948,1.66146-0.859374,0.83072-0.329427,1.56119-0.329427,0.5013,0,0.97396,0.114583,0.48698,0.100261,0.94531,0.24349,0.47266,0.128906,0.93099,0.243489,0.45833,0.10026,0.93099,0.10026,0.28646,0,0.60156-0.04297,0.3151-0.04297,0.71614-0.157551-0.90234,0.687499-1.57551,1.1888-0.67318,0.501302-1.26042,0.830728-0.58724,0.315104-1.17448,0.472656-0.57291,0.143229-1.28906,0.114583-0.70182-0.01432-1.33203-0.143229-0.61588-0.128906-1.13151-0.257812-0.5013-0.143229-0.88802-0.20052-0.37239-0.07161-0.58724,0.04297-0.51562,0.257812-0.90234,0.945312-0.38672,0.687499-0.65885,1.63281-0.25781,0.945312-0.42969,2.048175-0.15755,1.102863-0.24349,2.205727-0.0716,1.102863-0.0716,2.105466,0,0.98828,0.0573,1.718748-1.07422,0.687499-1.77604,1.188801-0.70182,0.501301-1.11719,0.830728-0.48698,0.386718-0.74479,0.673176,0.0143-0.859374,0.043-2.07682,0.0286-1.23177,0.043-2.578122,0.0286-1.346353,0.043-2.66406,0.0143-1.332029,0.0143-2.391924,0-0.673176-0.043-1.360676-0.0286-0.701822-0.22916-1.274738-0.20052-0.572916-0.63021-0.930988-0.41537-0.358073-1.1888-0.358073-0.30078,0-0.63021,0.07161-0.3151,0.05729-0.63021,0.214843,0.60156-0.401041,1.20313-0.816405,0.60156-0.415364,1.20312-0.744791,0.61588-0.343749,1.21745-0.54427,0.61588-0.214844,1.24609-0.214844,0.75911,0,1.17448,0.329427,0.42968,0.329427,0.61588,0.830728,0.20052,0.501302,0.22917,1.102864,0.043,0.601561,0.043,1.145832Z" style="fill:#A06CD5;stroke:#A06CD5;"/>
            </g>
          </svg>
          <h2 style="color: #A06CD5; font-size: 24px; margin-bottom: 0;">Welcome to Sirened Beta!</h2>
        </div>
        <p>Hello ${username},</p>
        <p>Thank you for joining Sirened – where independent authors and readers connect directly. We're excited to have you as part of our beta testing community!</p>
        <p>As a beta user, you'll have early access to our revolutionary platform as we continue to develop and refine the experience.</p>
        <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;">Here's what you can do now:</p>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            <li>Discover unique stories from independent authors</li>
            <li>Support authors directly with your purchases</li>
            <li>Follow your favorite storytellers</li>
            <li>Create wishlists and track your reading journey</li>
          </ul>
        </div>
        <p>We value your feedback as we work to transform indie publishing. If you encounter any issues or have suggestions, please don't hesitate to reach out to our support team.</p>
        <p>Happy reading!</p>
        <p>The Sirened Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>If you did not sign up for this service, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Welcome to Sirened Beta!
      
      Hello ${username},
      
      Thank you for joining Sirened – where independent authors and readers connect directly. We're excited to have you as part of our beta testing community!
      
      As a beta user, you'll have early access to our revolutionary platform as we continue to develop and refine the experience.
      
      Here's what you can do now:
      - Discover unique stories from independent authors
      - Support authors directly with your purchases
      - Follow your favorite storytellers
      - Create wishlists and track your reading journey
      
      We value your feedback as we work to transform indie publishing. If you encounter any issues or have suggestions, please don't hesitate to reach out to our support team.
      
      Happy reading!
      
      The Sirened Team
      
      If you did not sign up for this service, please ignore this email.
    `
  };
};

/**
 * Signup interest email template for users who express interest in joining the platform
 */
export const signupInterestEmailTemplate = (email: string) => {
  return {
    subject: "Thanks for your interest in Sirened!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #102B3F; background-color: #F6F0FB; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <!-- Sirened Logo - SVG embedded as base64 -->
          <svg width="200" height="80" viewBox="0 0 248 164" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 15px;">
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:1.9;" d="M106.12447,103.90686C158.60476,90.929392,213.46197,79.263842,249.66056,92.262052l-2.71272,1.13001C205.78547,80.920032,99.678381,109.61774,96.833749,119.52148Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="M71.505387,9.0161418C61.596771,44.0651,31.213375,57.767123,7.4727349,73.916703l1.4347442,4.15215C120.42306,50.092823,95.924471,140.12627,64.414047,160.01735l5.989347-5.0837C120.21411,111.64204,102.1536,64.729309,28.004715,68.221582,75.564889,24.747276,73.785532,11.440416,72.797766,10.365844Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="M114.92969,9.4513098C96.597511,39.480114,79.241393,44.884113,61.688923,55.241756l2.008314,2.710175C140.26895,74.79639,85.784041,106.10292,86.218271,137.86447l10.2959-17.52888C100.9118,101.34222,136.4546,74.935443,76.441215,53.82625,102.06531,35.796364,108.14064,23.612948,115.97441,10.903639Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="m138.9731,21.294919c-9.04889,14.045077-19.08261,24.584493-30.64932,29.667076,1.10254,0.491967,1.57178,0.5994,2.01356,0.877041,33.64716,14.167333,11.57992,23.271074-16.390779,73.418704l-9.57609,14.52493C104.24071,97.612868,151.91432,74.396671,118.58823,51.245149,128.96755,40.930331,135.05852,32.338207,139.64091,22.307061Z"/>
            <!-- Sirened text -->
            <g transform="translate(17.480896,1.8823242)" style="fill:#A06CD5;stroke:#A06CD5;">
              <path d="m124.043,57.367167q0,0.415364,0.0143,0.802083,0.0143,0.372395,0.0143,0.730468,0,0.845051-0.14322,1.446613-0.14323,0.601561-0.67318,0.959634-0.3151,0.229166-0.78776,0.529947-0.78776,0.515625-2.53515,1.575519,0.17187-0.458333,0.24349-1.102863,0.0859-0.658853,0.11458-1.246092,0.0286-0.6875,0-1.43229,0.90234-0.472656,1.58984-0.873697,0.6875-0.415364,1.17448-0.730468,0.57291-0.358073,0.98828-0.658854zM129.08613,81.77339q-1.63281,1.074218-2.77864,1.690103-1.13151,0.615884-1.94792,0.916665-0.8164,0.300781-1.375,0.34375-0.55859,0.04297-1.01692-0.04297-0.41537-0.07161-0.81641-0.214843-0.40104-0.143229-0.73047-0.515625-0.3151-0.386718-0.51562-1.102863-0.20052-0.716145-0.20052-1.947915,0-1.031248,0.0573-2.033851,0.0573-1.016926,0.11458-2.005206,0.0716-1.002603,0.10026-1.976561,0.043-0.98828,0.0143-1.962237-0.0286-0.945311-0.34375-1.374998-0.31511-0.44401-0.94531-0.44401-0.24349,0-0.52995,0.05729-0.28646,0.05729-0.61589,0.171875,0.51563-0.358072,1.0599-0.716145,0.54427-0.372395,1.10286-0.658853,0.5586-0.286458,1.11719-0.458333,0.57291-0.186198,1.13151-0.186198,0.60156,0,1.04557,0.272135,0.45833,0.272135,0.58724,0.902343,0.043,0.243489,0.0573,0.716145,0.0286,0.472656,0.0286,1.102863,0,0.930989-0.043,2.062498-0.0286,1.131509-0.0716,2.234372-0.043,1.088541-0.0859,2.019529-0.043,0.916666-0.0573,1.417967-0.0143,0.472656,0.17188,0.945312,0.1862,0.472656,0.54427,0.859374,0.37239,0.372395,0.90234,0.615885,0.54427,0.229166,1.23177,0.229166,0.60156,0,1.30338-0.214844,0.70183-0.214843,1.50391-0.701822Z" style="fill:#A06CD5;stroke:#A06CD5;"/>
              <path d="m134.69924,72.535119q0.67317-0.644531,1.46093-1.289061,0.80208-0.644531,1.61849-1.160155,0.83073-0.529948,1.66146-0.859374,0.83072-0.329427,1.56119-0.329427,0.5013,0,0.97396,0.114583,0.48698,0.100261,0.94531,0.24349,0.47266,0.128906,0.93099,0.243489,0.45833,0.10026,0.93099,0.10026,0.28646,0,0.60156-0.04297,0.3151-0.04297,0.71614-0.157551-0.90234,0.687499-1.57551,1.1888-0.67318,0.501302-1.26042,0.830728-0.58724,0.315104-1.17448,0.472656-0.57291,0.143229-1.28906,0.114583-0.70182-0.01432-1.33203-0.143229-0.61588-0.128906-1.13151-0.257812-0.5013-0.143229-0.88802-0.20052-0.37239-0.07161-0.58724,0.04297-0.51562,0.257812-0.90234,0.945312-0.38672,0.687499-0.65885,1.63281-0.25781,0.945312-0.42969,2.048175-0.15755,1.102863-0.24349,2.205727-0.0716,1.102863-0.0716,2.105466,0,0.98828,0.0573,1.718748-1.07422,0.687499-1.77604,1.188801-0.70182,0.501301-1.11719,0.830728-0.48698,0.386718-0.74479,0.673176,0.0143-0.859374,0.043-2.07682,0.0286-1.23177,0.043-2.578122,0.0286-1.346353,0.043-2.66406,0.0143-1.332029,0.0143-2.391924,0-0.673176-0.043-1.360676-0.0286-0.701822-0.22916-1.274738-0.20052-0.572916-0.63021-0.930988-0.41537-0.358073-1.1888-0.358073-0.30078,0-0.63021,0.07161-0.3151,0.05729-0.63021,0.214843,0.60156-0.401041,1.20313-0.816405,0.60156-0.415364,1.20312-0.744791,0.61588-0.343749,1.21745-0.54427,0.61588-0.214844,1.24609-0.214844,0.75911,0,1.17448,0.329427,0.42968,0.329427,0.61588,0.830728,0.20052,0.501302,0.22917,1.102864,0.043,0.601561,0.043,1.145832Z" style="fill:#A06CD5;stroke:#A06CD5;"/>
            </g>
          </svg>
          <h2 style="color: #A06CD5; font-size: 24px; margin-bottom: 0;">Thank You for Your Interest!</h2>
        </div>
        <p>Hello there,</p>
        <p>Thank you for your interest in Sirened – the digital platform revolutionizing how independent authors connect directly with readers.</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #EFA738; margin: 20px 0;">
          <p style="margin: 0;">We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and independent authors.</p>
        </div>
        <p>At Sirened, we're creating a vibrant ecosystem where:</p>
        <ul style="padding-left: 20px; color: #102B3F;">
          <li>Authors keep 100% of their sales with no platform fees</li>
          <li>Readers discover books based on quality, not marketing budgets</li>
          <li>Direct author support creates meaningful connections</li>
        </ul>
        <p>In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.</p>
        <p>We can't wait to welcome you to Sirened!</p>
        <p>Best regards,</p>
        <p>The Sirened Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>You received this email because ${email} was used to sign up for Sirened updates. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Thank You for Your Interest!
      
      Hello there,
      
      Thank you for your interest in Sirened – the digital platform revolutionizing how independent authors connect directly with readers.
      
      We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and independent authors.
      
      At Sirened, we're creating a vibrant ecosystem where:
      - Authors keep 100% of their sales with no platform fees
      - Readers discover books based on quality, not marketing budgets
      - Direct author support creates meaningful connections
      
      In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.
      
      We can't wait to welcome you to Sirened!
      
      Best regards,
      
      The Sirened Team
      
      You received this email because ${email} was used to sign up for Sirened updates. If you did not request this, please ignore this email.
    `
  };
};

/**
 * Beta key required email template for users who try to log in without a beta key
 */
export const betaKeyRequiredEmailTemplate = (email: string) => {
  return {
    subject: "Sirened Beta Access Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #102B3F; background-color: #F6F0FB; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <!-- Sirened Logo - SVG embedded as base64 -->
          <svg width="200" height="80" viewBox="0 0 248 164" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 15px;">
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:1.9;" d="M106.12447,103.90686C158.60476,90.929392,213.46197,79.263842,249.66056,92.262052l-2.71272,1.13001C205.78547,80.920032,99.678381,109.61774,96.833749,119.52148Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="M71.505387,9.0161418C61.596771,44.0651,31.213375,57.767123,7.4727349,73.916703l1.4347442,4.15215C120.42306,50.092823,95.924471,140.12627,64.414047,160.01735l5.989347-5.0837C120.21411,111.64204,102.1536,64.729309,28.004715,68.221582,75.564889,24.747276,73.785532,11.440416,72.797766,10.365844Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="M114.92969,9.4513098C96.597511,39.480114,79.241393,44.884113,61.688923,55.241756l2.008314,2.710175C140.26895,74.79639,85.784041,106.10292,86.218271,137.86447l10.2959-17.52888C100.9118,101.34222,136.4546,74.935443,76.441215,53.82625,102.06531,35.796364,108.14064,23.612948,115.97441,10.903639Z"/>
            <path style="fill:#A06CD5;stroke:#A06CD5;stroke-width:2.2066;" d="m138.9731,21.294919c-9.04889,14.045077-19.08261,24.584493-30.64932,29.667076,1.10254,0.491967,1.57178,0.5994,2.01356,0.877041,33.64716,14.167333,11.57992,23.271074-16.390779,73.418704l-9.57609,14.52493C104.24071,97.612868,151.91432,74.396671,118.58823,51.245149,128.96755,40.930331,135.05852,32.338207,139.64091,22.307061Z"/>
            <!-- Sirened text -->
            <g transform="translate(17.480896,1.8823242)" style="fill:#A06CD5;stroke:#A06CD5;">
              <path d="m124.043,57.367167q0,0.415364,0.0143,0.802083,0.0143,0.372395,0.0143,0.730468,0,0.845051-0.14322,1.446613-0.14323,0.601561-0.67318,0.959634-0.3151,0.229166-0.78776,0.529947-0.78776,0.515625-2.53515,1.575519,0.17187-0.458333,0.24349-1.102863,0.0859-0.658853,0.11458-1.246092,0.0286-0.6875,0-1.43229,0.90234-0.472656,1.58984-0.873697,0.6875-0.415364,1.17448-0.730468,0.57291-0.358073,0.98828-0.658854zM129.08613,81.77339q-1.63281,1.074218-2.77864,1.690103-1.13151,0.615884-1.94792,0.916665-0.8164,0.300781-1.375,0.34375-0.55859,0.04297-1.01692-0.04297-0.41537-0.07161-0.81641-0.214843-0.40104-0.143229-0.73047-0.515625-0.3151-0.386718-0.51562-1.102863-0.20052-0.716145-0.20052-1.947915,0-1.031248,0.0573-2.033851,0.0573-1.016926,0.11458-2.005206,0.0716-1.002603,0.10026-1.976561,0.043-0.98828,0.0143-1.962237-0.0286-0.945311-0.34375-1.374998-0.31511-0.44401-0.94531-0.44401-0.24349,0-0.52995,0.05729-0.28646,0.05729-0.61589,0.171875,0.51563-0.358072,1.0599-0.716145,0.54427-0.372395,1.10286-0.658853,0.5586-0.286458,1.11719-0.458333,0.57291-0.186198,1.13151-0.186198,0.60156,0,1.04557,0.272135,0.45833,0.272135,0.58724,0.902343,0.043,0.243489,0.0573,0.716145,0.0286,0.472656,0.0286,1.102863,0,0.930989-0.043,2.062498-0.0286,1.131509-0.0716,2.234372-0.043,1.088541-0.0859,2.019529-0.043,0.916666-0.0573,1.417967-0.0143,0.472656,0.17188,0.945312,0.1862,0.472656,0.54427,0.859374,0.37239,0.372395,0.90234,0.615885,0.54427,0.229166,1.23177,0.229166,0.60156,0,1.30338-0.214844,0.70183-0.214843,1.50391-0.701822Z" style="fill:#A06CD5;stroke:#A06CD5;"/>
              <path d="m134.69924,72.535119q0.67317-0.644531,1.46093-1.289061,0.80208-0.644531,1.61849-1.160155,0.83073-0.529948,1.66146-0.859374,0.83072-0.329427,1.56119-0.329427,0.5013,0,0.97396,0.114583,0.48698,0.100261,0.94531,0.24349,0.47266,0.128906,0.93099,0.243489,0.45833,0.10026,0.93099,0.10026,0.28646,0,0.60156-0.04297,0.3151-0.04297,0.71614-0.157551-0.90234,0.687499-1.57551,1.1888-0.67318,0.501302-1.26042,0.830728-0.58724,0.315104-1.17448,0.472656-0.57291,0.143229-1.28906,0.114583-0.70182-0.01432-1.33203-0.143229-0.61588-0.128906-1.13151-0.257812-0.5013-0.143229-0.88802-0.20052-0.37239-0.07161-0.58724,0.04297-0.51562,0.257812-0.90234,0.945312-0.38672,0.687499-0.65885,1.63281-0.25781,0.945312-0.42969,2.048175-0.15755,1.102863-0.24349,2.205727-0.0716,1.102863-0.0716,2.105466,0,0.98828,0.0573,1.718748-1.07422,0.687499-1.77604,1.188801-0.70182,0.501301-1.11719,0.830728-0.48698,0.386718-0.74479,0.673176,0.0143-0.859374,0.043-2.07682,0.0286-1.23177,0.043-2.578122,0.0286-1.346353,0.043-2.66406,0.0143-1.332029,0.0143-2.391924,0-0.673176-0.043-1.360676-0.0286-0.701822-0.22916-1.274738-0.20052-0.572916-0.63021-0.930988-0.41537-0.358073-1.1888-0.358073-0.30078,0-0.63021,0.07161-0.3151,0.05729-0.63021,0.214843,0.60156-0.401041,1.20313-0.816405,0.60156-0.415364,1.20312-0.744791,0.61588-0.343749,1.21745-0.54427,0.61588-0.214844,1.24609-0.214844,0.75911,0,1.17448,0.329427,0.42968,0.329427,0.61588,0.830728,0.20052,0.501302,0.22917,1.102864,0.043,0.601561,0.043,1.145832Z" style="fill:#A06CD5;stroke:#A06CD5;"/>
            </g>
          </svg>
          <h2 style="color: #A06CD5; font-size: 24px; margin-bottom: 0;">Sirened Beta Access</h2>
        </div>
        <p>Hello there,</p>
        <p>We noticed you recently tried to access Sirened, but you don't have beta access yet.</p>
        <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Sirened is currently in a limited beta testing phase, and access is by invitation only. To join our revolutionary indie publishing platform, you'll need a valid beta key.</p>
        </div>
        <p>If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.</p>
        <p>If you haven't signed up for the waitlist yet, you can do so on our website at <a href="https://sirened.com" style="color: #EFA738; text-decoration: none; font-weight: bold;">sirened.com</a>.</p>
        <p>We're creating a platform where:</p>
        <ul style="padding-left: 20px; color: #102B3F;">
          <li>Independent authors thrive</li>
          <li>Quality stories get the attention they deserve</li>
          <li>Readers connect directly with creators</li>
        </ul>
        <p>Thank you for your interest in Sirened!</p>
        <p>Best regards,</p>
        <p>The Sirened Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>You received this email because ${email} was used to attempt access to Sirened. If you did not try to access our platform, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Sirened Beta Access
      
      Hello there,
      
      We noticed you recently tried to access Sirened, but you don't have beta access yet.
      
      Sirened is currently in a limited beta testing phase, and access is by invitation only. To join our revolutionary indie publishing platform, you'll need a valid beta key.
      
      If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.
      
      If you haven't signed up for the waitlist yet, you can do so on our website at sirened.com.
      
      We're creating a platform where:
      - Independent authors thrive
      - Quality stories get the attention they deserve
      - Readers connect directly with creators
      
      Thank you for your interest in Sirened!
      
      Best regards,
      
      The Sirened Team
      
      You received this email because ${email} was used to attempt access to Sirened. If you did not try to access our platform, please ignore this email.
    `
  };
};