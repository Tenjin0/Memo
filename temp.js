tif ('update' === req.params.method && req.params.id){
    console.log('method -------------- ',req.params.method);
    req.models.import.get(req.params.id, function(err, imported){
        if(err){
            next(err);
        } else {
            console.log(' import/save/ftp req.body before import save ', req.body.import.id_trigger);
            imported.save(req.body.import, function (err, importSaved){
                if (err) {
                    next(err);
                } else {
                    console.log(' import/save/ftp req.body after import save ', req.body.import.id_trigger);
                    console.log(' import/save/ftp imported after import save ', imported.id_trigger);
                    console.log(' import/save/ftp importSaved after import save ', importSaved.id_trigger);
                    transaction.commit(function (err) {
                        if (err) {
                            next(err);
                        } else {
                            req.models.import.get(req.params.id, function(err, import2){
                                res.send(import2);
                            });
                        }
                    });
                }
            });
        }
    });
}

{
    "import":{
    "creation_datetime": 1438936663,
    "id_trigger": null,
        "original_filename": null,
        "original_filesize": null,
        "ftp_host": "ftp.patricepetit.96.lt",
        "ftp_port": 21,
        "ftp_filepath": "importTenji.csv",
        "ftp_login": "u231138740.tenji",
        "ftp_password": "patman00",
        "import_name": "TenjiImportMinute",
        "id_user": 1,
        "emails": "petitpatrice@gmail.com",
        "import_list_automatic_creation": true,
        "import_action": "INSERT",
        "import_type": "SMS",
        "status": "not_loaded",
        "active_deduplication": true,
        "is_qualified": false,
        "charset": "utf-8",
        "column_separator": ";",
        "column_enclosure": null,
        "column_escape": "\\",
        "end_line": "\\n",
        "is_null_replaced": false,
        "id_import_list_information": null,
        "id_company": 1
    }
}
