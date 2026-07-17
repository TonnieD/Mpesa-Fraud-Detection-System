# This utility function will perform the following:
# 1. Create new feature called drain_rate
# 2. perform cyclic encoding from temporal features
# 3. create new feature called account_emptied

def feature_engineering(df):

    def day_mapper():
        mapper = {'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7}
        df['day'] =  df['day_of_week'].map(mapper)
        return df

    def cyclic_encoder():
        directory = {
            'hour': 24,
            'day': 7,
            'month_2026': 12
        }
        for col in directory:
            df[f"{col}_sin"] = np.sin(2 * np.pi * df[col] / directory[col])
            df[f"{col}_cos"] = np.cos(2 * np.pi * df[col] / directory[col])
        return df

    def drain_rate():
        df['drain_rate'] = (df['amount']/df['sender_balance_before']) * 100
        return df

    def account_emptied():
        df['account_emptied'] = df['amount'] >= df['sender_balance_before']
        df['account_emptied'] = df['account_emptied'].map({True: 1, False: 0})
        return df
    
    df = day_mapper()
    df = cyclic_encoder()
    df = drain_rate()
    df = account_emptied()
    
    return df
