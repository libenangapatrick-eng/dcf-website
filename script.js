// badala ya .insert([...]) tumia .upsert([...])
const { data, error } = await supabaseClient
    .from('members')
    .upsert(
        {
            user_id: userId,
            member_no: memberNo,
            email: email,
            full_name: fullName,
            gender: gender,
            dob: dob,
            phone: phone,
            occupation: occupation,
            nationality: nationality,
            nida_no: nidaNo,
            passport_no: passportNo,
            country: country
        },
        { 
            onConflict: 'user_id'
        }
    );

if (error) {
    console.error("Shida katika kuhifadhi taarifa:", error.message);
    alert("Shida katika kuhifadhi taarifa: " + error.message);
} else {
    alert("Taarifa zimehifadhiwa kikamilifu!");
}
