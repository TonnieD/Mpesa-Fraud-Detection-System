# This utility will perform the following
#1. Delete columns that are not needed
#2. Map the device column to binary(smartphone: 0, feature: 1)
#3. calls the encoder from ../models/encoder.pkl and applies it to preprocessed df

def preprocessing(df):
    def columns_dropper():
        columns_to_drop = ['transaction_id', 'hour', 'day_of_week', 'month_2026', 'day',
                            'sender_balance_after', 'receiver_balance_before',
                            'receiver_balance_after']
        df.drop(columns=columns_to_drop, inplace=True, errors='ignore')
        return df
    
    def device_mapper():
        df['device_type'] = df['device_type'].map({'smartphone': 0, 'feature': 1})
        return df

    def encode():
        import joblib
        encoder = joblib.load('../models/encoder.pkl')   #Load encoder
        encoded_data = encoder.transform(df)   #Apply onehot encoder

        return encoded_data

    df = columns_dropper()
    df = device_mapper()

    return encode()
