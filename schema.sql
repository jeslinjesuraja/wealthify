-- schema.sql
-- Table structure for storing mutual fund transaction data imported from CSV

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    amc_code VARCHAR(50),
    folio_no VARCHAR(100),
    prodcode VARCHAR(50),
    scheme VARCHAR(255) NOT NULL,
    inv_name VARCHAR(255) NOT NULL,
    trxntype VARCHAR(50),
    trxnno VARCHAR(100),
    trxnmode VARCHAR(50),
    trxnstat VARCHAR(50),
    usercode VARCHAR(50),
    usrtrxno VARCHAR(100),
    traddate TIMESTAMP NOT NULL,
    postdate TIMESTAMP,
    purprice DECIMAL(18, 4),
    units DECIMAL(18, 4),
    amount DECIMAL(18, 2),
    brokcode VARCHAR(100),
    pan VARCHAR(20) NOT NULL,
    location VARCHAR(100),
    scheme_type VARCHAR(100),
    tax_status VARCHAR(100),
    bank_name VARCHAR(100)
);
